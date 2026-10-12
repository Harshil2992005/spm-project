from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
import uuid
from app.schemas.common import BlankToNone

class PatientBase(BlankToNone):
    patient_id: Optional[str] = None
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BlankToNone):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None

class Patient(PatientBase):
    patient_id: str
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
