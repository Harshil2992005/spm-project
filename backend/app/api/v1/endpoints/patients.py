from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles
from app.crud import crud_patient
from app.schemas import patient_schema
from typing import List
import uuid

router = APIRouter(dependencies=[Depends(require_roles("Manager"))])

@router.get("/", response_model=List[patient_schema.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = crud_patient.get_patients(db, skip=skip, limit=limit)
    return patients

@router.post("/", response_model=patient_schema.Patient, status_code=status.HTTP_201_CREATED)
def create_patient(patient: patient_schema.PatientCreate, db: Session = Depends(get_db)):
    if patient.patient_id and crud_patient.get_patient_by_patient_id(db, patient_id=patient.patient_id):
        raise HTTPException(status_code=400, detail="Patient ID already exists")
    return crud_patient.create_patient(db=db, patient=patient)

@router.get("/{patient_id}", response_model=patient_schema.Patient)
def read_patient(patient_id: uuid.UUID, db: Session = Depends(get_db)):
    patient = crud_patient.get_patient(db, patient_id=patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=patient_schema.Patient)
def update_patient(patient_id: uuid.UUID, patient: patient_schema.PatientUpdate, db: Session = Depends(get_db)):
    db_patient = crud_patient.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return crud_patient.update_patient(db=db, patient_id=patient_id, patient=patient)

@router.delete("/{patient_id}")
def delete_patient(patient_id: uuid.UUID, db: Session = Depends(get_db)):
    db_patient = crud_patient.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    try:
        crud_patient.delete_patient(db=db, patient_id=patient_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This patient has bills or prescriptions and cannot be deleted.",
        )
    return {"message": "Patient deleted successfully"}
