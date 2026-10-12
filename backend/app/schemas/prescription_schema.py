from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
import uuid
from app.schemas.common import BlankToNone

class PrescriptionItemBase(BlankToNone):
    medicine_id: uuid.UUID
    quantity_prescribed: int = Field(gt=0)
    quantity_dispensed: int = 0
    dosage_instructions: Optional[str] = None

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItem(PrescriptionItemBase):
    id: uuid.UUID
    prescription_id: uuid.UUID
    created_at: datetime
    class Config:
        from_attributes = True

class PrescriptionBase(BlankToNone):
    patient_id: uuid.UUID
    doctor_name: str
    doctor_license: Optional[str] = None
    diagnosis: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: str = 'Pending'
    prescribed_by: Optional[uuid.UUID] = None

class PrescriptionCreate(PrescriptionBase):
    prescription_number: Optional[str] = None
    items: List[PrescriptionItemCreate] = []

class PrescriptionUpdate(BlankToNone):
    doctor_name: Optional[str] = None
    doctor_license: Optional[str] = None
    diagnosis: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None
    items: Optional[List[PrescriptionItemCreate]] = None

class Prescription(PrescriptionBase):
    id: uuid.UUID
    prescription_number: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
