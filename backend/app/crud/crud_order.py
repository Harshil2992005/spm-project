from datetime import date
from decimal import Decimal
import uuid

from sqlalchemy.orm import Session

from app.core.timeutil import IST
from app.crud import crud_sale
from app.models import models, sales_models
from app.schemas import sale_schema


class OrderError(Exception):
    """Order cannot be saved. Message is user-facing."""


def generate_order_number(db: Session) -> str:
    """ORD-YYYYMMDD-NNNN, the next free sequence number for today (IST)."""
    from datetime import datetime
    prefix = f"ORD-{datetime.now(IST).strftime('%Y%m%d')}-"
    last = (
        db.query(sales_models.Order.order_number)
        .filter(sales_models.Order.order_number.like(prefix + "%"))
        .order_by(sales_models.Order.order_number.desc())
        .first()
    )
    seq = int(last[0].rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}{seq:04d}"


def get_orders(db: Session, skip=0, limit=100, patient_ids=None):
    q = db.query(sales_models.Order)
    if patient_ids is not None:
        q = q.filter(sales_models.Order.patient_id.in_(patient_ids))
    return q.order_by(sales_models.Order.created_at.desc()).offset(skip).limit(limit).all()


def get_order(db: Session, oid: uuid.UUID):
    return db.query(sales_models.Order).filter(sales_models.Order.id == oid).first()


def create_order(db: Session, data, customer_id: uuid.UUID, patient_id: uuid.UUID):
    """Validate the requested cart, snapshot prices, and store as a Pending order.

    Stock is NOT decremented here — the sale (and stock movement) happens when the
    manager approves the order.
    """
    if not db.query(models.Patient.id).filter(models.Patient.id == patient_id).first():
        raise OrderError("Select a valid patient for this order.")

    wanted = {}
    for item in data.items:
        wanted[item.medicine_id] = wanted.get(item.medicine_id, 0) + item.quantity
    if not wanted:
        raise OrderError("Add at least one medicine to your order.")

    lines = []
    for medicine_id, qty in wanted.items():
        med = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
        if med is None:
            raise OrderError("One of the selected medicines no longer exists.")
        if med.is_active is False:
            raise OrderError(f"{med.name} is inactive and cannot be ordered.")
        if med.expiry_date and med.expiry_date < date.today():
            raise OrderError(f"{med.name} is expired and cannot be ordered.")
        if med.quantity_in_stock < qty:
            raise OrderError(f"Only {med.quantity_in_stock} unit(s) of {med.name} in stock (requested {qty}).")
        unit = Decimal(med.unit_price)
        lines.append((med, qty, unit, unit * qty))

    order = sales_models.Order(
        order_number=generate_order_number(db),
        patient_id=patient_id,
        customer_id=customer_id,
        status="Pending",
        notes=data.notes,
    )
    db.add(order)
    db.flush()
    for med, qty, unit, subtotal in lines:
        db.add(sales_models.OrderItem(
            order_id=order.id,
            medicine_id=med.id,
            quantity=qty,
            unit_price=unit,
            subtotal=subtotal,
        ))
    db.commit()
    db.refresh(order)
    crud_sale.log_activity(db, customer_id, "Order placed", "Orders", order.order_number)
    return order


def approve_order(db: Session, oid: uuid.UUID, cashier_id: uuid.UUID):
    """Approve a Pending order: charge the patient via create_sale (validates stock,
    decrements inventory) and mark the order Approved with a link to the bill."""
    order = get_order(db, oid)
    if order is None:
        raise OrderError("Order not found.")
    if order.status != "Pending":
        raise OrderError(f"This order is already {order.status}.")

    items = (
        db.query(sales_models.OrderItem).filter(sales_models.OrderItem.order_id == order.id).all()
    )
    sale_data = sale_schema.SaleCreate(
        patient_id=order.patient_id,
        discount_amount=0,
        tax_amount=0,
        payment_method="Cash",
        payment_status="Pending",
        notes=order.notes,
        items=[
            sale_schema.SaleItemCreate(medicine_id=it.medicine_id, quantity=it.quantity)
            for it in items
        ],
    )
    try:
        sale = crud_sale.create_sale(db, sale_data, cashier_id=cashier_id)
    except crud_sale.BillingError as exc:
        db.rollback()
        raise OrderError(str(exc))

    order.sale_id = sale.id
    order.status = "Approved"
    db.commit()
    db.refresh(order)
    crud_sale.log_activity(db, cashier_id, "Order approved", "Orders", f"{order.order_number} -> {sale.bill_number}")
    return order, sale


def set_order_status(db: Session, oid: uuid.UUID, status: str, actor_id: uuid.UUID, by_owner=False):
    """Reject (manager) or cancel (owner). Rejected orders may be re-opened by managers later."""
    order = get_order(db, oid)
    if order is None:
        raise OrderError("Order not found.")
    if order.status != "Pending":
        raise OrderError(f"This order is already {order.status}.")
    if by_owner and status != "Cancelled":
        raise OrderError("Customers may only cancel their own pending orders.")
    order.status = status
    db.commit()
    db.refresh(order)
    crud_sale.log_activity(db, actor_id, f"Order {status.lower()}", "Orders", order.order_number)
    return order