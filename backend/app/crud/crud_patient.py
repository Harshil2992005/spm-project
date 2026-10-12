import re
import uuid

from sqlalchemy.orm import Session

from app.models import models
from app.schemas import patient_schema


def get_patient(db: Session, patient_id: uuid.UUID):
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()


def get_patient_by_patient_id(db: Session, patient_id: str):
    return db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()


def get_patient_by_email(db: Session, email: str):
    return db.query(models.Patient).filter(models.Patient.email.ilike(email)).first()


def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).order_by(models.Patient.created_at.desc()).offset(skip).limit(limit).all()


def next_patient_code(db: Session) -> str:
    """PAT001, PAT002, ... (next free number after the highest existing PAT###)."""
    highest = 0
    for (code,) in db.query(models.Patient.patient_id).all():
        m = re.fullmatch(r"PAT(\d+)", code or "")
        if m:
            highest = max(highest, int(m.group(1)))
    return f"PAT{highest + 1:03d}"


def create_patient(db: Session, patient: patient_schema.PatientCreate):
    data = patient.model_dump()
    if not data.get("patient_id"):
        data["patient_id"] = next_patient_code(db)
    db_patient = models.Patient(**data)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient(db: Session, patient_id: uuid.UUID, patient: patient_schema.PatientUpdate):
    db_patient = get_patient(db, patient_id=patient_id)
    if db_patient:
        update_data = patient.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is None and field in ("first_name", "last_name"):
                continue  # NOT NULL columns - a blank means "leave unchanged"
            setattr(db_patient, field, value)
        db.commit()
        db.refresh(db_patient)
    return db_patient


def delete_patient(db: Session, patient_id: uuid.UUID):
    db_patient = get_patient(db, patient_id=patient_id)
    if db_patient:
        db.delete(db_patient)
        db.commit()
    return db_patient
