from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_role_name, require_roles
from app.core.timeutil import as_utc, fmt_ist
from app.crud import crud_sale
from app.crud.crud_sale import BillingError
from app.models import models, sales_models
from app.schemas import sale_schema
from app.utils.email import send_bill_email
from typing import List
import uuid

router = APIRouter(dependencies=[Depends(get_current_user)])


def _own_patient_ids(db: Session, user):
    """Patient record(s) that belong to this (customer) user, matched by e-mail."""
    return [
        p.id
        for p in db.query(models.Patient).filter(models.Patient.email.ilike(user.email)).all()
    ]


def _bill_payload(db: Session, sale):
    """Everything the e-mail needs, as plain data (safe to use after the DB session closes).

    Returns (recipient_email, payload) or (None, None) when the patient has no e-mail."""
    patient = db.query(models.Patient).filter(models.Patient.id == sale.patient_id).first()
    if not patient or not patient.email:
        return None, None
    items = db.query(sales_models.SaleItem).filter(sales_models.SaleItem.sale_id == sale.id).all()
    lines = []
    for it in items:
        med = db.query(models.Medicine).filter(models.Medicine.id == it.medicine_id).first()
        lines.append({
            "name": med.name if med else str(it.medicine_id),
            "qty": it.quantity,
            "unit_price": float(it.unit_price or 0),
            "subtotal": float(it.subtotal or 0),
        })
    return patient.email, {
        "bill_number": sale.bill_number,
        "patient_name": f"{patient.first_name} {patient.last_name}".strip(),
        "sale_date": fmt_ist(sale.sale_date),
        "items": lines,
        "total": float(sale.total_amount or 0),
        "discount": float(sale.discount_amount or 0),
        "tax": float(sale.tax_amount or 0),
        "net": float(sale.net_amount or 0),
        "payment_method": sale.payment_method,
        "payment_status": sale.payment_status,
    }


def _sale_patient(db: Session, sale):
    p = db.query(models.Patient).filter(models.Patient.id == sale.patient_id).first()
    if not p:
        return "", False
    return f"{p.first_name} {p.last_name}".strip(), bool(p.email)


def _sale_items(db: Session, sale):
    out = []
    for it in db.query(sales_models.SaleItem).filter(sales_models.SaleItem.sale_id == sale.id).all():
        med = db.query(models.Medicine).filter(models.Medicine.id == it.medicine_id).first()
        out.append({
            "id": it.id,
            "sale_id": it.sale_id,
            "medicine_id": it.medicine_id,
            "medicine_name": med.name if med else str(it.medicine_id),
            "quantity": it.quantity,
            "unit_price": float(it.unit_price or 0),
            "subtotal": float(it.subtotal or 0),
        })
    return out


def _serialize_sale(db: Session, sale, with_items: bool = False) -> dict:
    name, has_email = _sale_patient(db, sale)
    return {
        "id": sale.id,
        "bill_number": sale.bill_number,
        "patient_id": sale.patient_id,
        "cashier_id": sale.cashier_id,
        "total_amount": float(sale.total_amount or 0),
        "discount_amount": float(sale.discount_amount or 0),
        "tax_amount": float(sale.tax_amount or 0),
        "net_amount": float(sale.net_amount or 0),
        "payment_method": sale.payment_method,
        "payment_status": sale.payment_status,
        "notes": sale.notes,
        "sale_date": as_utc(sale.sale_date),  # explicit UTC so browsers show the right local time
        "patient_name": name,
        "has_email": has_email,
        "items": _sale_items(db, sale) if with_items else [],
    }


@router.get('/', response_model=List[sale_schema.SaleOut])
def list_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    if get_role_name(db, current_user.role_id) == 'Customer':
        sales = crud_sale.get_sales(db, skip, limit, patient_ids=_own_patient_ids(db, current_user))
    else:
        sales = crud_sale.get_sales(db, skip, limit)
    return [_serialize_sale(db, s) for s in sales]


@router.post('/', response_model=sale_schema.SaleOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles("Manager"))])
def create_sale(
    data: sale_schema.SaleCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        sale = crud_sale.create_sale(db, data, cashier_id=current_user.id)
    except BillingError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    # Invoice e-mail goes out in the background so the cashier is never kept waiting on SMTP.
    to_email, payload = _bill_payload(db, sale)
    if to_email:
        background.add_task(send_bill_email, to_email, payload)
    return _serialize_sale(db, sale, with_items=True)


@router.get('/{sid}', response_model=sale_schema.SaleOut)
def get_sale(sid: uuid.UUID, db: Session = Depends(get_db),
             current_user: models.User = Depends(get_current_user)):
    s = crud_sale.get_sale(db, sid)
    if not s:
        raise HTTPException(404, 'Sale not found')
    if get_role_name(db, current_user.role_id) == 'Customer' \
            and s.patient_id not in _own_patient_ids(db, current_user):
        raise HTTPException(404, 'Sale not found')
    return _serialize_sale(db, s, with_items=True)


@router.post('/{sid}/send-email', response_model=sale_schema.SendEmailResult,
             dependencies=[Depends(require_roles("Manager"))])
def resend_bill_email(sid: uuid.UUID, db: Session = Depends(get_db)):
    sale = crud_sale.get_sale(db, sid)
    if not sale:
        raise HTTPException(404, 'Sale not found')
    to_email, payload = _bill_payload(db, sale)
    if not to_email:
        raise HTTPException(400, 'This patient has no e-mail on record. Edit the patient and add one.')
    if send_bill_email(to_email, payload):
        return {"sent": True, "message": f"Invoice {sale.bill_number} e-mailed to the patient"}
    return {"sent": False,
            "message": f"E-mail could not be delivered for {sale.bill_number} (SMTP not configured or rejected - see server log)"}
