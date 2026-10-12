from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_role_name, require_roles
from app.crud import crud_prescription
from app.crud.crud_prescription import PrescriptionError
from app.crud.crud_sale import log_activity
from app.models import models, sales_models
from app.schemas import prescription_schema
from app.utils.email import send_prescription_email
from typing import List
import uuid

router = APIRouter(dependencies=[Depends(get_current_user)])


def _own_patient_ids(db: Session, user):
    """Patient record(s) that belong to this (customer) user, matched by e-mail."""
    return [
        p.id
        for p in db.query(models.Patient).filter(models.Patient.email.ilike(user.email)).all()
    ]


def _prescription_payload(db: Session, rx):
    """Plain-data e-mail payload (safe after the session closes). (None, None) if no e-mail."""
    patient = db.query(models.Patient).filter(models.Patient.id == rx.patient_id).first()
    if not patient or not patient.email:
        return None, None
    items = db.query(sales_models.PrescriptionItem).filter(
        sales_models.PrescriptionItem.prescription_id == rx.id
    ).all()
    lines = []
    for it in items:
        med = db.query(models.Medicine).filter(models.Medicine.id == it.medicine_id).first()
        lines.append({
            "name": med.name if med else str(it.medicine_id),
            "quantity": it.quantity_prescribed,
            "dosage": it.dosage_instructions,
        })
    return patient.email, {
        "prescription_number": rx.prescription_number,
        "patient_name": f"{patient.first_name} {patient.last_name}".strip(),
        "doctor_name": rx.doctor_name,
        "issue_date": rx.issue_date.strftime("%d %b %Y") if rx.issue_date else "",
        "status": rx.status,
        "items": lines,
    }


@router.get('/', response_model=List[prescription_schema.Prescription])
def list_prescriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    if get_role_name(db, current_user.role_id) == 'Customer':
        return crud_prescription.get_prescriptions(db, skip, limit, patient_ids=_own_patient_ids(db, current_user))
    return crud_prescription.get_prescriptions(db, skip, limit)


@router.post('/', response_model=prescription_schema.Prescription, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles("Manager"))])
def create_prescription(
    data: prescription_schema.PrescriptionCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data.prescribed_by = current_user.id
    try:
        rx = crud_prescription.create_prescription(db, data)
    except PrescriptionError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    log_activity(db, current_user.id, "Prescription created", "Prescriptions", rx.prescription_number)
    to_email, payload = _prescription_payload(db, rx)
    if to_email:
        background.add_task(send_prescription_email, to_email, payload)
    return rx


@router.get('/{pid}', response_model=prescription_schema.Prescription)
def get_prescription(pid: uuid.UUID, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    rx = crud_prescription.get_prescription(db, pid)
    if not rx:
        raise HTTPException(404, 'Not found')
    if get_role_name(db, current_user.role_id) == 'Customer' \
            and rx.patient_id not in _own_patient_ids(db, current_user):
        raise HTTPException(404, 'Not found')
    return rx


@router.put('/{pid}', response_model=prescription_schema.Prescription,
            dependencies=[Depends(require_roles("Manager"))])
def update_prescription(pid: uuid.UUID, data: prescription_schema.PrescriptionUpdate, db: Session = Depends(get_db)):
    p = crud_prescription.update_prescription(db, pid, data)
    if not p:
        raise HTTPException(404, 'Not found')
    return p


@router.delete('/{pid}', dependencies=[Depends(require_roles("Manager"))])
def delete_prescription(pid: uuid.UUID, db: Session = Depends(get_db)):
    if not crud_prescription.delete_prescription(db, pid):
        raise HTTPException(404, 'Not found')
    return {'message': 'deleted'}
