from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid

class MedicineBase(BaseModel):
    medicine_code: str
    name: str
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    unit_price: float
    purchase_price: float
    quantity_in_stock: int = 0
    minimum_stock_level: int = 10
    maximum_stock_level: Optional[int] = 1000
    batch_number: Optional[str] = None
    manufacture_date: Optional[date] = None
    expiry_date: date
    storage_location: Optional[str] = None
    is_active: bool = True

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    unit_price: Optional[float] = None
    purchase_price: Optional[float] = None
    quantity_in_stock: Optional[int] = None
    minimum_stock_level: Optional[int] = None
    maximum_stock_level: Optional[int] = None
    batch_number: Optional[str] = None
    manufacture_date: Optional[date] = None
    expiry_date: Optional[date] = None
    storage_location: Optional[str] = None
    is_active: Optional[bool] = None

class Medicine(MedicineBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
