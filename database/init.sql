-- ============================================================================
-- Pharmacy Management System (PMS-001) - Database Initialization Script
-- Target: PostgreSQL 15
-- This script is mounted into the postgres container and is executed once,
-- on first start, before the FastAPI application boots. It creates the full
-- relational schema and loads a small set of reference / demo rows.
-- The application (see backend/app/utils/seed.py) additionally seeds the
-- default administrator account, because it must be hashed with bcrypt.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Reference table: roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Users of the system
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    role_id       INTEGER REFERENCES roles(id),
    is_active     BOOLEAN DEFAULT TRUE,
    otp_code      VARCHAR(6),
    otp_expires_at TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- Patients / customers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id         VARCHAR(20) UNIQUE NOT NULL,
    first_name         VARCHAR(50) NOT NULL,
    last_name          VARCHAR(50) NOT NULL,
    date_of_birth      DATE,
    gender             VARCHAR(10),
    phone              VARCHAR(20),
    email              VARCHAR(100),
    address            TEXT,
    insurance_number   VARCHAR(50),
    insurance_provider VARCHAR(100),
    emergency_contact  VARCHAR(20),
    medical_history    TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_patients_patient_id ON patients(patient_id);

-- ----------------------------------------------------------------------------
-- Medicine inventory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_code       VARCHAR(20) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    generic_name        VARCHAR(100),
    manufacturer        VARCHAR(100),
    dosage_form         VARCHAR(50),
    strength            VARCHAR(50),
    unit_price          DECIMAL(10, 2) NOT NULL,
    purchase_price      DECIMAL(10, 2) NOT NULL,
    quantity_in_stock   INTEGER NOT NULL DEFAULT 0,
    minimum_stock_level INTEGER NOT NULL DEFAULT 10,
    maximum_stock_level INTEGER DEFAULT 1000,
    batch_number        VARCHAR(50),
    manufacture_date    DATE,
    expiry_date         DATE NOT NULL,
    storage_location    VARCHAR(100),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_medicines_code ON medicines(medicine_code);
CREATE INDEX IF NOT EXISTS ix_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS ix_medicines_expiry ON medicines(expiry_date);

-- ----------------------------------------------------------------------------
-- Prescriptions and their line items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id          UUID NOT NULL REFERENCES patients(id),
    doctor_name         VARCHAR(100) NOT NULL,
    doctor_license      VARCHAR(50),
    diagnosis           TEXT,
    issue_date          DATE NOT NULL,
    expiry_date         DATE,
    status              VARCHAR(20) DEFAULT 'Pending',
    prescribed_by       UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_prescriptions_number ON prescriptions(prescription_number);

CREATE TABLE IF NOT EXISTS prescription_items (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id      UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id          UUID NOT NULL REFERENCES medicines(id),
    quantity_prescribed  INTEGER NOT NULL,
    quantity_dispensed   INTEGER DEFAULT 0,
    dosage_instructions  TEXT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Sales / billing and their line items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number     VARCHAR(20) UNIQUE NOT NULL,
    patient_id      UUID NOT NULL REFERENCES patients(id),
    cashier_id      UUID NOT NULL REFERENCES users(id),
    total_amount    DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount      DECIMAL(10, 2) DEFAULT 0,
    net_amount      DECIMAL(10, 2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL,
    payment_status  VARCHAR(20) DEFAULT 'Paid',
    sale_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes           TEXT
);
CREATE INDEX IF NOT EXISTS ix_sales_bill_number ON sales(bill_number);

CREATE TABLE IF NOT EXISTS sale_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    quantity    INTEGER NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    subtotal    DECIMAL(10, 2) NOT NULL
);

-- ----------------------------------------------------------------------------
-- Audit trail and notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    module     VARCHAR(50) NOT NULL,
    details    TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    type                VARCHAR(20) DEFAULT 'Info',
    is_read             INTEGER DEFAULT 0,
    related_entity_type VARCHAR(50),
    related_entity_id   UUID,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Seed data
-- ============================================================================

INSERT INTO roles (name, description) VALUES
    ('Manager',  'Administrator with full system access'),
    ('Customer', 'Patient / customer account')
ON CONFLICT (name) DO NOTHING;

INSERT INTO medicines
    (medicine_code, name, generic_name, manufacturer, dosage_form, strength,
     unit_price, purchase_price, quantity_in_stock, minimum_stock_level,
     maximum_stock_level, batch_number, manufacture_date, expiry_date, storage_location)
VALUES
    ('MED001', 'Paracetamol 500mg', 'Acetaminophen', 'Cipla',       'Tablet',    '500 mg',     5.00,   2.50, 500, 100, 1000, 'B2026A01', CURRENT_DATE - 120, CURRENT_DATE + 400, 'Shelf A1'),
    ('MED002', 'Amoxicillin 250mg', 'Amoxicillin',   'Sun Pharma',  'Capsule',   '250 mg',    18.50,  11.00,  40,  30,  500, 'B2026A02', CURRENT_DATE - 120, CURRENT_DATE + 180, 'Shelf B2'),
    ('MED003', 'Amoxicillin 500mg', 'Amoxicillin',   'Sun Pharma',  'Capsule',   '500 mg',    32.00,  20.00,  25,  30,  500, 'B2026A03', CURRENT_DATE - 120, CURRENT_DATE + 190, 'Shelf B2'),
    ('MED004', 'Azithromycin 500mg','Azithromycin',  'Alkem',       'Tablet',    '500 mg',    78.00,  55.00,  18,  20,  300, 'B2026A04', CURRENT_DATE - 120, CURRENT_DATE +  75, 'Shelf B3'),
    ('MED005', 'Metformin 500mg',   'Metformin HCl', 'USV',         'Tablet',    '500 mg',     9.00,   5.00, 900, 100, 2000, 'B2026A05', CURRENT_DATE - 120, CURRENT_DATE + 900, 'Shelf C1'),
    ('MED006', 'Amlodipine 5mg',    'Amlodipine',    'Torrent',     'Tablet',    '5 mg',      11.50,   6.50,   8,  20,  400, 'B2026A06', CURRENT_DATE - 120, CURRENT_DATE +  25, 'Shelf C2'),
    ('MED007', 'Cetirizine 10mg',   'Cetirizine HCl','Dr. Reddy''s','Tablet',    '10 mg',      4.50,   2.00, 300,  50, 1000, 'B2026A07', CURRENT_DATE - 120, CURRENT_DATE + 500, 'Shelf A3'),
    ('MED008', 'Insulin Glargine',  'Insulin glargine','Sanofi',    'Injection', '100 IU/ml',620.00, 480.00,  12,  10,  100, 'B2026A08', CURRENT_DATE - 120, CURRENT_DATE + 150, 'Fridge 1'),
    ('MED009', 'Ibuprofen 400mg',   'Ibuprofen',     'Zydus',       'Tablet',    '400 mg',     7.00,   3.50, 150,  40,  800, 'B2026A09', CURRENT_DATE - 120, CURRENT_DATE +  35, 'Shelf A4'),
    ('MED010', 'Omeprazole 20mg',   'Omeprazole',    'Mankind',     'Capsule',   '20 mg',     12.00,   7.00,  60,  25,  500, 'B2026A10', CURRENT_DATE - 120, CURRENT_DATE + 420, 'Shelf B1')
ON CONFLICT (medicine_code) DO NOTHING;

INSERT INTO patients
    (patient_id, first_name, last_name, date_of_birth, gender, phone, email,
     address, insurance_number, insurance_provider, emergency_contact, medical_history)
VALUES
    ('PAT001', 'Ramesh', 'Patel', DATE '1985-06-15', 'Male',   '9876543210', 'ramesh.p@gmail.com',  'Ahmedabad, Gujarat', 'POL12345', 'LIC HFL', '9876543210', 'None reported'),
    ('PAT002', 'Sarla',  'Shah',  DATE '1990-02-20', 'Female', '9825012345', 'sarla.shah@yahoo.com','Gandhinagar, Gujarat', NULL, NULL, '9825012345', 'Hypertension'),
    ('PAT003', 'Vikas',  'Desai', DATE '1978-11-05', 'Male',   '9909008877', 'vikas.desai@gmail.com','Mehsana, Gujarat',   'COV88990', 'Acko', '9909008877', 'Diabetes Type 2')
ON CONFLICT (patient_id) DO NOTHING;

-- ============================================================================
-- End of initialization script
-- ============================================================================
