from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import models


def get_or_create_role(db: Session, name: str, description: str) -> models.Role:
    role = db.query(models.Role).filter(models.Role.name == name).first()
    if role is None:
        role = models.Role(name=name, description=description)
        db.add(role)
        db.flush()
    return role


def seed_roles(db: Session):
    role_defs = [
        ("Manager", "Administrator with full system access"),
        ("Customer", "Patient / customer account"),
    ]
    for name, desc in role_defs:
        get_or_create_role(db, name, desc)
    db.commit()


def seed_admin(db: Session):
    from app.core.config import settings

    if db.query(models.User).filter(models.User.username == settings.ADMIN_USERNAME).first():
        return
    manager = db.query(models.Role).filter(models.Role.name == "Manager").first()
    admin = models.User(
        username=settings.ADMIN_USERNAME,
        email=settings.ADMIN_EMAIL,
        first_name="System",
        last_name="Administrator",
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role_id=manager.id if manager else None,
        is_active=True,
    )
    db.add(admin)
    db.commit()


def seed_sample_data(db: Session):
    if db.query(models.Medicine).count() > 0 or db.query(models.Patient).count() > 0:
        return

    today = date.today()
    medicines = [
        ("MED001", "Paracetamol 500mg", "Acetaminophen", "Cipla", "Tablet", "500 mg", 5.00, 2.50, 500, 100, 1000, "B2026A01", today + timedelta(days=400), "Shelf A1"),
        ("MED002", "Amoxicillin 250mg", "Amoxicillin", "Sun Pharma", "Capsule", "250 mg", 18.50, 11.00, 40, 30, 500, "B2026A02", today + timedelta(days=180), "Shelf B2"),
        ("MED003", "Amoxicillin 500mg", "Amoxicillin", "Sun Pharma", "Capsule", "500 mg", 32.00, 20.00, 25, 30, 500, "B2026A03", today + timedelta(days=190), "Shelf B2"),
        ("MED004", "Azithromycin 500mg", "Azithromycin", "Alkem", "Tablet", "500 mg", 78.00, 55.00, 18, 20, 300, "B2026A04", today + timedelta(days=75), "Shelf B3"),
        ("MED005", "Metformin 500mg", "Metformin HCl", "USV", "Tablet", "500 mg", 9.00, 5.00, 900, 100, 2000, "B2026A05", today + timedelta(days=900), "Shelf C1"),
        ("MED006", "Amlodipine 5mg", "Amlodipine", "Torrent", "Tablet", "5 mg", 11.50, 6.50, 8, 20, 400, "B2026A06", today + timedelta(days=25), "Shelf C2"),
        ("MED007", "Cetirizine 10mg", "Cetirizine HCl", "Dr. Reddy's", "Tablet", "10 mg", 4.50, 2.00, 300, 50, 1000, "B2026A07", today + timedelta(days=500), "Shelf A3"),
        ("MED008", "Insulin Glargine", "Insulin glargine", "Sanofi", "Injection", "100 IU/ml", 620.00, 480.00, 12, 10, 100, "B2026A08", today + timedelta(days=150), "Fridge 1"),
        ("MED009", "Ibuprofen 400mg", "Ibuprofen", "Zydus", "Tablet", "400 mg", 7.00, 3.50, 150, 40, 800, "B2026A09", today + timedelta(days=35), "Shelf A4"),
        ("MED010", "Omeprazole 20mg", "Omeprazole", "Mankind", "Capsule", "20 mg", 12.00, 7.00, 60, 25, 500, "B2026A10", today + timedelta(days=420), "Shelf B1"),
    ]
    for m in medicines:
        db.add(
            models.Medicine(
                medicine_code=m[0], name=m[1], generic_name=m[2], manufacturer=m[3],
                dosage_form=m[4], strength=m[5], unit_price=m[6], purchase_price=m[7],
                quantity_in_stock=m[8], minimum_stock_level=m[9], maximum_stock_level=m[10],
                batch_number=m[11], manufacture_date=today - timedelta(days=120),
                expiry_date=m[12], storage_location=m[13], is_active=True,
            )
        )

    patients = [
        ("PAT001", "Ramesh", "Patel", "Male", "9876543210", "ramesh.p@gmail.com", "Ahmedabad, Gujarat", "POL12345", "LIC HFL"),
        ("PAT002", "Sarla", "Shah", "Female", "9825012345", "sarla.shah@yahoo.com", "Gandhinagar, Gujarat", None, None),
        ("PAT003", "Vikas", "Desai", "Male", "9909008877", "vikas.desai@gmail.com", "Mehsana, Gujarat", "COV88990", "Acko"),
    ]
    for p in patients:
        db.add(
            models.Patient(
                patient_id=p[0], first_name=p[1], last_name=p[2], date_of_birth=date(1985, 6, 15),
                gender=p[3], phone=p[4], email=p[5], address=p[6], insurance_number=p[7],
                insurance_provider=p[8], emergency_contact=p[4], medical_history="None reported",
            )
        )

    db.commit()