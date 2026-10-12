from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from app.schemas.common import BlankToNone


class SaleItemBase(BaseModel):
    medicine_id: uuid.UUID
    quantity: int
    unit_price: float
    subtotal: float


class SaleItemCreate(BlankToNone):
    """Client only chooses medicine + quantity; prices are always taken from the DB."""
    medicine_id: uuid.UUID
    quantity: int = Field(gt=0)


class SaleItem(SaleItemBase):
    id: uuid.UUID
    sale_id: uuid.UUID
    class Config:
        from_attributes = True


class SaleCreate(BlankToNone):
    patient_id: uuid.UUID
    discount_amount: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    payment_method: str = 'Cash'
    payment_status: str = 'Paid'
    notes: Optional[str] = None
    items: List[SaleItemCreate] = []


class Sale(BaseModel):
    id: uuid.UUID
    bill_number: str
    patient_id: uuid.UUID
    cashier_id: uuid.UUID
    total_amount: float
    discount_amount: float = 0
    tax_amount: float = 0
    net_amount: float
    payment_method: str
    payment_status: str = 'Paid'
    notes: Optional[str] = None
    sale_date: datetime
    class Config:
        from_attributes = True


class SaleItemOut(SaleItemBase):
    id: uuid.UUID
    sale_id: uuid.UUID
    medicine_name: Optional[str] = None
    class Config:
        from_attributes = True


class SaleOut(Sale):
    patient_name: Optional[str] = None
    has_email: bool = False
    items: List[SaleItemOut] = []
    class Config:
        from_attributes = True


class SendEmailResult(BaseModel):
    sent: bool
    message: str
