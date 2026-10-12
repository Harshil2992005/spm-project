from datetime import date
import uuid

from sqlalchemy.orm import Session

from app.core.timeutil import IST
from app.models import models
from app.models import sales_models


class PrescriptionError(Exception):
    """Prescription cannot be saved. Message is user-facing."""


def generate_prescription_number(db: Session):
    """RX-YYYYMMDD-NNNN, the next free sequence number for today (IST)."""
    from datetime import datetime
    prefix = f"RX-{datetime.now(IST).strftime('%Y%m%d')}-"
    last = (
        db.query(sales_models.Prescription.prescription_number)
        .filter(sales_models.Prescription.prescription_number.like(prefix + "%"))
        .order_by(sales_models.Prescription.prescription_number.desc())
        .first()
    )
    seq = int(last[0].rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}{seq:04d}"


def get_prescriptions(db: Session, skip=0, limit=100, patient_ids=None):
    q = db.query(sales_models.Prescription)
    if patient_ids is not None:
        q = q.filter(sales_models.Prescription.patient_id.in_(patient_ids))
    return q.order_by(sales_models.Prescription.created_at.desc()).offset(skip).limit(limit).all()


def get_prescription(db: Session, pid: uuid.UUID):
    return db.query(sales_models.Prescription).filter(sales_models.Prescription.id == pid).first()


def create_prescription(db: Session, data):
    if not db.query(models.Patient.id).filter(models.Patient.id == data.patient_id).first():
        raise PrescriptionError("Select a valid patient.")
    if not data.items:
        raise PrescriptionError("Add at least one medicine to the prescription.")
    for item in data.items:
        if not db.query(models.Medicine.id).filter(models.Medicine.id == item.medicine_id).first():
            raise PrescriptionError("One of the selected medicines no longer exists.")

    rx = sales_models.Prescription(
        prescription_number=generate_prescription_number(db),
        patient_id=data.patient_id,
        doctor_name=data.doctor_name,
        doctor_license=data.doctor_license,
        diagnosis=data.diagnosis,
        issue_date=data.issue_date or date.today(),
        expiry_date=data.expiry_date,
        status=data.status,
        prescribed_by=data.prescribed_by,
    )
    db.add(rx)
    db.flush()
    for item in data.items:
        db.add(sales_models.PrescriptionItem(
            prescription_id=rx.id,
            medicine_id=item.medicine_id,
            quantity_prescribed=item.quantity_prescribed,
            quantity_dispensed=item.quantity_dispensed,
            dosage_instructions=item.dosage_instructions,
        ))
    db.commit()
    db.refresh(rx)
    return rx


def update_prescription(db: Session, pid: uuid.UUID, data):
    rx = get_prescription(db, pid)
    if not rx:
        return None
    upd = data.model_dump(exclude_unset=True)
    upd.pop('items', None)
    for k, v in upd.items():
        if v is None and k in ('doctor_name', 'status', 'issue_date'):
            continue  # NOT NULL / defaulted columns - blank means "leave unchanged"
        setattr(rx, k, v)
    db.commit()
    db.refresh(rx)
    return rx


def delete_prescription(db: Session, pid: uuid.UUID):
    rx = get_prescription(db, pid)
    if rx:
        db.delete(rx)
        db.commit()
    return rx
