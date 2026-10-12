from datetime import date
from decimal import Decimal
import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.timeutil import now_utc, today_ist_compact
from app.models import sales_models, models


class BillingError(Exception):
    """A bill cannot be created (bad patient / medicine / stock). Message is user-facing."""


def generate_bill_number(db: Session) -> str:
    """BILL-YYYYMMDD-NNNN, the next free sequence number for today (IST)."""
    prefix = f"BILL-{today_ist_compact()}-"
    last = (
        db.query(sales_models.Sale.bill_number)
        .filter(sales_models.Sale.bill_number.like(prefix + "%"))
        .order_by(sales_models.Sale.bill_number.desc())
        .first()
    )
    seq = int(last[0].rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}{seq:04d}"


def get_sales(db: Session, skip=0, limit=100, patient_ids=None):
    q = db.query(sales_models.Sale)
    if patient_ids is not None:
        q = q.filter(sales_models.Sale.patient_id.in_(patient_ids))
    return q.order_by(sales_models.Sale.sale_date.desc()).offset(skip).limit(limit).all()


def get_sale(db: Session, sid: uuid.UUID):
    return db.query(sales_models.Sale).filter(sales_models.Sale.id == sid).first()


def log_activity(db: Session, user_id, action: str, module: str, details: str = None):
    try:
        db.add(sales_models.ActivityLog(
            user_id=user_id, action=action, module=module, details=details
        ))
        db.commit()
    except Exception:
        db.rollback()


def _build_lines(db: Session, data):
    """Validate the cart and price it from the database (never trust client prices)."""
    wanted = {}
    for item in data.items:
        wanted[item.medicine_id] = wanted.get(item.medicine_id, 0) + item.quantity
    if not wanted:
        raise BillingError("Add at least one medicine to the bill.")

    lines = []
    for medicine_id, qty in wanted.items():
        med = (
            db.query(models.Medicine)
            .filter(models.Medicine.id == medicine_id)
            .with_for_update()
            .first()
        )
        if med is None:
            raise BillingError("One of the selected medicines no longer exists.")
        if med.is_active is False:
            raise BillingError(f"{med.name} is inactive and cannot be sold.")
        if med.expiry_date and med.expiry_date < date.today():
            raise BillingError(f"{med.name} is expired and cannot be sold.")
        if med.quantity_in_stock < qty:
            raise BillingError(f"Only {med.quantity_in_stock} unit(s) of {med.name} in stock (requested {qty}).")
        unit = Decimal(med.unit_price)
        lines.append((med, qty, unit, unit * qty))
    return lines


def create_sale(db: Session, data, cashier_id):
    patient = db.query(models.Patient).filter(models.Patient.id == data.patient_id).first()
    if patient is None:
        raise BillingError("Select a valid patient for this bill.")

    lines = _build_lines(db, data)
    total = sum((ln[3] for ln in lines), Decimal("0"))
    discount = Decimal(str(data.discount_amount or 0))
    tax = Decimal(str(data.tax_amount or 0))
    if discount > total:
        raise BillingError("Discount cannot be more than the bill subtotal.")
    net = total - discount + tax

    for attempt in range(3):  # retry if two bills race for the same number
        sale = sales_models.Sale(
            bill_number=generate_bill_number(db),
            patient_id=data.patient_id,
            cashier_id=cashier_id,
            total_amount=total,
            discount_amount=discount,
            tax_amount=tax,
            net_amount=net,
            payment_method=data.payment_method,
            payment_status=data.payment_status,
            notes=data.notes,
            sale_date=now_utc(),
        )
        db.add(sale)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            if attempt == 2:
                raise
            lines = _build_lines(db, data)  # row locks were released by the rollback
            continue
        break

    for med, qty, unit, subtotal in lines:
        db.add(sales_models.SaleItem(
            sale_id=sale.id, medicine_id=med.id, quantity=qty, unit_price=unit, subtotal=subtotal
        ))
        med.quantity_in_stock = med.quantity_in_stock - qty
    db.commit()
    db.refresh(sale)
    log_activity(db, sale.cashier_id, "Sale created", "Billing", sale.bill_number)
    return sale
