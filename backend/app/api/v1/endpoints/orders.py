from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, get_role_name, require_roles
from app.crud import crud_order
from app.crud.crud_order import OrderError
from app.api.v1.endpoints.sales import _bill_payload
from app.models import models, sales_models
from app.schemas import order_schema
from app.utils.email import send_bill_email

router = APIRouter(dependencies=[Depends(get_current_user)])


def _own_patient_ids(db: Session, user):
    """Patient record(s) that belong to this (customer) user, matched by e-mail."""
    return [
        p.id
        for p in db.query(models.Patient).filter(models.Patient.email.ilike(user.email)).all()
    ]


def _order_patient_name(db: Session, order):
    p = db.query(models.Patient).filter(models.Patient.id == order.patient_id).first()
    if not p:
        return ""
    return f"{p.first_name} {p.last_name}".strip()


def _order_items(db: Session, order):
    out = []
    for it in (
        db.query(sales_models.OrderItem)
        .filter(sales_models.OrderItem.order_id == order.id)
        .all()
    ):
        med = db.query(models.Medicine).filter(models.Medicine.id == it.medicine_id).first()
        out.append({
            "id": it.id,
            "order_id": it.order_id,
            "medicine_id": it.medicine_id,
            "medicine_name": med.name if med else str(it.medicine_id),
            "quantity": it.quantity,
            "unit_price": float(it.unit_price or 0),
            "subtotal": float(it.subtotal or 0),
        })
    return out


def _serialize_order(db: Session, order, with_items: bool = False) -> dict:
    sale = db.query(sales_models.Sale).filter(sales_models.Sale.id == order.sale_id).first() \
        if order.sale_id else None
    return {
        "id": order.id,
        "order_number": order.order_number,
        "patient_id": order.patient_id,
        "patient_name": _order_patient_name(db, order),
        "customer_id": order.customer_id,
        "status": order.status,
        "sale_id": order.sale_id,
        "bill_number": sale.bill_number if sale else None,
        "notes": order.notes,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": _order_items(db, order) if with_items else [],
    }


@router.get("/", response_model=List[order_schema.OrderOut])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    if get_role_name(db, current_user.role_id) == 'Customer':
        orders = crud_order.get_orders(db, skip, limit, patient_ids=_own_patient_ids(db, current_user))
    else:
        orders = crud_order.get_orders(db, skip, limit)
    return [_serialize_order(db, o, with_items=True) for o in orders]


@router.get("/{oid}", response_model=order_schema.OrderOut)
def get_order(oid: uuid.UUID, db: Session = Depends(get_db),
              current_user: models.User = Depends(get_current_user)):
    order = crud_order.get_order(db, oid)
    if not order:
        raise HTTPException(404, 'Order not found')
    if get_role_name(db, current_user.role_id) == 'Customer' \
            and order.patient_id not in _own_patient_ids(db, current_user):
        raise HTTPException(404, 'Order not found')
    return _serialize_order(db, order, with_items=True)


@router.post("/", response_model=order_schema.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(data: order_schema.OrderCreate, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """Customers order against their own patient profile; managers pick the patient."""
    role = get_role_name(db, current_user.role_id)
    if role == 'Customer':
        own = _own_patient_ids(db, current_user)
        if not own:
            raise HTTPException(400, "No patient profile found for your account. Ask the pharmacy to add your details.")
        patient_id = own[0]
    else:
        if not data.patient_id:
            raise HTTPException(400, "Select a patient for this order.")
        patient_id = data.patient_id

    try:
        order = crud_order.create_order(db, data, customer_id=current_user.id, patient_id=patient_id)
    except OrderError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    return _serialize_order(db, order, with_items=True)


@router.post("/{oid}/approve", response_model=order_schema.OrderOut,
             dependencies=[Depends(require_roles("Manager"))])
def approve_order(oid: uuid.UUID, background: BackgroundTasks, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    try:
        order, sale = crud_order.approve_order(db, oid, cashier_id=current_user.id)
    except OrderError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    to_email, payload = _bill_payload(db, sale)
    if to_email:
        background.add_task(send_bill_email, to_email, payload)
    return _serialize_order(db, order, with_items=True)


@router.post("/{oid}/reject", response_model=order_schema.OrderOut,
             dependencies=[Depends(require_roles("Manager"))])
def reject_order(oid: uuid.UUID, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    try:
        order = crud_order.set_order_status(db, oid, "Rejected", actor_id=current_user.id)
    except OrderError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    return _serialize_order(db, order, with_items=True)


@router.post("/{oid}/cancel", response_model=order_schema.OrderOut)
def cancel_order(oid: uuid.UUID, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """Customers cancel their own pending order; managers may cancel any pending order."""
    order = crud_order.get_order(db, oid)
    if not order:
        raise HTTPException(404, 'Order not found')
    if get_role_name(db, current_user.role_id) == 'Customer' \
            and order.patient_id not in _own_patient_ids(db, current_user):
        raise HTTPException(404, 'Order not found')
    try:
        order = crud_order.set_order_status(db, oid, "Cancelled", actor_id=current_user.id,
                                            by_owner=get_role_name(db, current_user.role_id) == 'Customer')
    except OrderError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    return _serialize_order(db, order, with_items=True)