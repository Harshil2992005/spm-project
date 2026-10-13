from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from app.schemas.common import BlankToNone


class OrderItemCreate(BaseModel):
    """Client only chooses medicine + quantity; the price is snapshotted from the DB."""
    medicine_id: uuid.UUID
    quantity: int = Field(gt=0)


class OrderCreate(BlankToNone):
    patient_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate] = []


class OrderItemOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    medicine_id: uuid.UUID
    medicine_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: uuid.UUID
    order_number: str
    patient_id: uuid.UUID
    patient_name: Optional[str] = None
    customer_id: uuid.UUID
    status: str = 'Pending'
    sale_id: Optional[uuid.UUID] = None
    bill_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemOut] = []
    class Config:
        from_attributes = True