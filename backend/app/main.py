from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.endpoints import auth, medicines, orders, patients, prescriptions, sales, users
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.utils.seed import seed_admin, seed_roles, seed_sample_data
import app.models.models  # noqa: F401  (register tables)
import app.models.sales_models  # noqa: F401  (register tables)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:  # existing databases: DOB is optional (auto-created customer profiles)
        conn.execute(text("ALTER TABLE patients ALTER COLUMN date_of_birth DROP NOT NULL"))
    db: Session = SessionLocal()
    try:
        seed_roles(db)
        if settings.SEED_DEMO_DATA:
            seed_sample_data(db)
        seed_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Pharmacy Management System API",
    description="API for Pharmacy Management System - PMS-001",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3100", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(medicines.router, prefix="/api/v1/medicines", tags=["Medicines"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(prescriptions.router, prefix="/api/v1/prescriptions", tags=["Prescriptions"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])


@app.get("/")
async def root():
    return {"message": "Pharmacy Management System API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}