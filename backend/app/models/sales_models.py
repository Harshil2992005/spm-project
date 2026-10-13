from sqlalchemy import Column, String, Integer, Date, DateTime, DECIMAL, Text, ForeignKey, UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Prescription(Base):
    __tablename__ = 'prescriptions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_number = Column(String(20), unique=True, nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    doctor_name = Column(String(100), nullable=False)
    doctor_license = Column(String(50))
    diagnosis = Column(Text)
    issue_date = Column(Date, nullable=False, default=func.now())
    expiry_date = Column(Date)
    status = Column(String(20), default='Pending')
    prescribed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class PrescriptionItem(Base):
    __tablename__ = 'prescription_items'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False)
    medicine_id = Column(UUID(as_uuid=True), ForeignKey('medicines.id'), nullable=False)
    quantity_prescribed = Column(Integer, nullable=False)
    quantity_dispensed = Column(Integer, default=0)
    dosage_instructions = Column(Text)
    created_at = Column(DateTime, default=func.now())

class Order(Base):
    """A customer's cart request. Approving it creates the Sale and e-mails the invoice."""
    __tablename__ = 'orders'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    status = Column(String(20), default='Pending')  # Pending | Approved | Rejected | Cancelled
    sale_id = Column(UUID(as_uuid=True), ForeignKey('sales.id'))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class OrderItem(Base):
    __tablename__ = 'order_items'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    medicine_id = Column(UUID(as_uuid=True), ForeignKey('medicines.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)  # snapshot from the catalogue at order time
    subtotal = Column(DECIMAL(10, 2), nullable=False)

class Sale(Base):
    __tablename__ = 'sales'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_number = Column(String(20), unique=True, nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    cashier_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    discount_amount = Column(DECIMAL(10, 2), default=0)
    tax_amount = Column(DECIMAL(10, 2), default=0)
    net_amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(String(20), nullable=False)
    payment_status = Column(String(20), default='Paid')
    sale_date = Column(DateTime, default=func.now())
    notes = Column(Text)

class SaleItem(Base):
    __tablename__ = 'sale_items'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id = Column(UUID(as_uuid=True), ForeignKey('sales.id', ondelete='CASCADE'), nullable=False)
    medicine_id = Column(UUID(as_uuid=True), ForeignKey('medicines.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    action = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False)
    details = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=func.now())

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default='Info')
    is_read = Column(Integer, default=0)  # use int for simplicity
    related_entity_type = Column(String(50))
    related_entity_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=func.now())
