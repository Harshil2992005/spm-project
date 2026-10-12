from sqlalchemy.orm import Session
from app.models import models
from app.schemas import medicine_schema
import uuid

def get_medicine(db: Session, medicine_id: uuid.UUID):
    return db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()

def get_medicine_by_code(db: Session, medicine_code: str):
    return db.query(models.Medicine).filter(models.Medicine.medicine_code == medicine_code).first()

def get_medicines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Medicine).offset(skip).limit(limit).all()

def get_low_stock_medicines(db: Session):
    return db.query(models.Medicine).filter(
        models.Medicine.quantity_in_stock <= models.Medicine.minimum_stock_level
    ).all()

def get_expiring_soon_medicines(db: Session):
    from datetime import date, timedelta
    threshold = date.today() + timedelta(days=30)
    return db.query(models.Medicine).filter(
        models.Medicine.expiry_date <= threshold,
        models.Medicine.expiry_date >= date.today()
    ).all()

def create_medicine(db: Session, medicine: medicine_schema.MedicineCreate):
    db_medicine = models.Medicine(**medicine.model_dump())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

def update_medicine(db: Session, medicine_id: uuid.UUID, medicine: medicine_schema.MedicineUpdate):
    db_medicine = get_medicine(db, medicine_id=medicine_id)
    if db_medicine:
        update_data = medicine.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_medicine, field, value)
        db.commit()
        db.refresh(db_medicine)
    return db_medicine

def delete_medicine(db: Session, medicine_id: uuid.UUID):
    db_medicine = get_medicine(db, medicine_id=medicine_id)
    if db_medicine:
        db.delete(db_medicine)
        db.commit()
    return db_medicine
