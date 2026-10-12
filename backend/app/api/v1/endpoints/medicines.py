from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.crud import crud_medicine
from app.schemas import medicine_schema
from typing import List
import uuid

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[medicine_schema.Medicine])
def read_medicines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    medicines = crud_medicine.get_medicines(db, skip=skip, limit=limit)
    return medicines

@router.post("/", response_model=medicine_schema.Medicine, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles("Manager"))])
def create_medicine(medicine: medicine_schema.MedicineCreate, db: Session = Depends(get_db)):
    existing_code = crud_medicine.get_medicine_by_code(db, medicine_code=medicine.medicine_code)
    if existing_code:
        raise HTTPException(status_code=400, detail="Medicine code already exists")
    return crud_medicine.create_medicine(db=db, medicine=medicine)

@router.get("/low-stock/", response_model=List[medicine_schema.Medicine])
def get_low_stock_medicines(db: Session = Depends(get_db)):
    return crud_medicine.get_low_stock_medicines(db)

@router.get("/expiring-soon/", response_model=List[medicine_schema.Medicine])
def get_expiring_soon_medicines(db: Session = Depends(get_db)):
    return crud_medicine.get_expiring_soon_medicines(db)

@router.get("/{medicine_id}", response_model=medicine_schema.Medicine)
def read_medicine(medicine_id: uuid.UUID, db: Session = Depends(get_db)):
    medicine = crud_medicine.get_medicine(db, medicine_id=medicine_id)
    if medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine

@router.put("/{medicine_id}", response_model=medicine_schema.Medicine,
            dependencies=[Depends(require_roles("Manager"))])
def update_medicine(medicine_id: uuid.UUID, medicine: medicine_schema.MedicineUpdate, db: Session = Depends(get_db)):
    db_medicine = crud_medicine.get_medicine(db, medicine_id=medicine_id)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return crud_medicine.update_medicine(db=db, medicine_id=medicine_id, medicine=medicine)

@router.delete("/{medicine_id}", dependencies=[Depends(require_roles("Manager"))])
def delete_medicine(medicine_id: uuid.UUID, db: Session = Depends(get_db)):
    db_medicine = crud_medicine.get_medicine(db, medicine_id=medicine_id)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    try:
        crud_medicine.delete_medicine(db=db, medicine_id=medicine_id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This medicine is used in bills or prescriptions and cannot be deleted. Mark it inactive instead.",
        )
    return {"message": "Medicine deleted successfully"}