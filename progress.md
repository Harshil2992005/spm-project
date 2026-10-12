# PharmaMS — Progress & Implementation Log (Detailed)

> **Purpose:** This document is a complete, self-contained record of the current
> state of the PharmaMS project — architecture, code, database, configuration,
> every feature built, every bug fixed, and everything still open. It is written
> so that **another AI (e.g. Claude) can read only this file and generate a
> precise, detailed prompt** for the next phase, without needing to re-explore
> the codebase.
>
> **Project:** Pharmacy Management System — `PMS-001` (academic SPM project).
> **Platform this runs on:** Windows 11 (host) + Docker Desktop / WSL2.
> **Last updated:** 2026-10-12.

---

## Table of Contents

1. High-Level Summary
2. Tech Stack (exact versions)
3. System Architecture (Docker)
4. Repository Layout
5. How to Build / Run / Operate
6. Backend — Deep Dive
   6.1 `main.py`
   6.2 Configuration (`core/config.py`)
   6.3 Security (`core/security.py`)
   6.4 Database (`core/database.py`)
   6.5 Data Models (SQLAlchemy)
   6.6 Pydantic Schemas
   6.7 CRUD layer
   6.8 API Endpoints (full reference)
   6.9 Seeding
7. Frontend — Deep Dive
   7.1 Routing & Theme (`App.jsx`)
   7.2 State (`AuthContext.jsx`)
   7.3 HTTP layer (`services/api.js`)
   7.4 Pages (one by one)
8. Authentication & Authorization
9. Roles & RBAC
10. E-mail Subsystem
11. Database — Full Schema & Seed
12. Configuration / `.env`
13. Core User Journeys (step-by-step)
13b. Verified Test Log (executed commands & results)
14. Bugs Fixed (root cause + fix)
14.1 Known Code Quirks / Gotchas
15. Current State, Limitations & Roadmap
16. Changelog (file-by-file)
17. Glossary / Conventions
14. Appendix: Reusable snippets

---

## 1. High-Level Summary

PharmaMS is a **full-stack pharmacy management web app** with:

- **Inventory** of medicines (stock counts, low-stock alerts, expiry alerts).
- **Patient** records.
3. **Prescriptions** (doctor, diagnosis, multiple medicine line items).
4. **Billing / POS** — build a bill from medicines, auto-compute subtotal/net, generate a bill number.
5. **Authentication**: password login, **6-digit e-mail OTP** login, self **registration**, and optional **Google Sign-In** (wired but disabled).
11. **Automatic e-mail notifications**: when a **bill** is created it is e-mailed to the patient; same for a new **prescription**.
12. Runs as **3 Docker Compose containers** (Postgres, FastAPI, Nginx+React).

**Primary goal of the current phase (done):**
- Implement **real** e-mail (Gmail SMTP), replacing the earlier "demo mode".
- Reduce roles to exactly **Manager** + **Customer**.
- Provide clear **Login / Sign Up** buttons and a working **registration** page.

---

## 2. Tech Stack (exact versions)

### Backend (`backend/requirements.txt`)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
python-jose[cryptography]==3.3.0
bcrypt==4.0.1
python-multipart==0.0.6
pydantic[email]==2.5.0
python-dotenv==1.0.0
pydantic-settings==2.1.0
google-auth==2.25.2
```
- Python base image: `python:3.11-slim`.
- Notable: **Pydantic v2** ⇒ code uses `.model_dump()` / `model_validate()` (not `.dict()` / `.from_orm()`).

### Frontend (`frontend/package.json`)
```
react 18.2, react-dom 18.2, react-router-dom 6.20
@mui/material 5.14, @mui/icons-material, @mui/x-data-grid 6.18, @mui/x-date-pickers 6.18
@emotion/react, @emotion/styled
axios 1.6, date-fns 2.30, dayjs 1.11
dev: vite 5, @vitejs/plugin-react, eslint
```
- Build output served by **nginx:alpine**; dev via Vite.

### Database
- **PostgreSQL 15** (`postgres:15-alpine`), `uuid-ossp` extension.

---

## 3. System Architecture (Docker Compose)

`docker-compose.yml` defines **3 services**:

```
┌────────────────────────────────────────────────────────────────────┐
│  Browser  ──►  http://localhost:3000                                 │
│         frontend (nginx)  ── static React SPA                        │
│                 │  /api/*  proxy_pass http://backend:8000            │
│                 ▼                                                    │
│         backend (uvicorn/FastAPI)  :8000  ─────►  db (postgres) :5432│
│                 volumes: ./backend:/app (live reload)               │
│         db volume: postgres_data (persistent)                       │
└────────────────────────────────────────────────────────────────────┘
```

| Service | Image / build | Ports | Key details |
|---|---|---|---|
| `db` | `postgres:15-alpine` | `5432:5432` | env `POSTGRES_USER=pharmacy_user`, `POSTGRES_PASSWORD=pharmacy_pass`, `POSTGRES_DB=pharmacy_db`; volume `postgres_data`; `database/init.sql` mounted to `/docker-entrypoint-initdb.d/` (runs once on empty volume); healthcheck `pg_isready` |
| `backend` | `docker/backend.Dockerfile` | `8000:8000` | mounts `./backend:/app`; runs `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`; `depends_on: db (service_healthy)`; all env from `${VAR}` in `.env` |
| `frontend` | `docker/frontend.Dockerfile` | `3000:80` | multi-stage: `vite build` → nginx static; `nginx.conf` proxies `/api/` → `backend:8000`, SPA fallback `try_files $uri /index.html` |

`docker/backend.Dockerfile`: `python:3.11-slim`; installs `libpq-dev gcc`; `pip install requirements.txt`; `COPY backend/ .`; `EXPOSE 8000`.

`docker/frontend.Dockerfile`: `node` stage → `npm ci/install` + `vite build`; copies `nginx.conf`; `EXPOSE 80`.

**URLs:** UI `http://localhost:3000` · API `http://localhost:8000` · Swagger `http://localhost:8000/docs` · OpenAPI `http://localhost:8000/openapi.json`.

---

## 4. Repository Layout

```
REPORT SPM/
├─ .env                          # docker compose config + secrets (SMTP, Google)
├─ docker-compose.yml
├─ README.md
├─ guide.md                      # Hinglish step-by-step setup guide
├─ progress.md                   # ← this file
├─ Report_2_Status_Review_2.docx / .pdf
├─ Report_3_Final_Documentation.docx / .pdf
├─ spm(1) (1).docx
├─ docker/
│   ├─ backend.Dockerfile
│   └─ frontend.Dockerfile
├─ database/
│   └─ init.sql                  # full schema + reference seed
├─ backend/
│   ├─ requirements.txt
│   └─ app/
│       ├─ main.py
│       ├─ api/v1/endpoints/
│       │   ├─ auth.py           # login, register, me, OTP, Google
│       │   ├─ users.py          # Manager-only user management
│       │   ├─ medicines.py
│       │   ├─ patients.py
│       │   ├─ prescriptions.py  # e-mails patient
│       │   └─ sales.py          # e-mails bill to patient
│       ├─ core/{config,database,security}.py
│       ├─ crud/{crud_user,crud_medicine,crud_patient,crud_prescription,crud_sale}.py
│       ├─ models/{models,sales_models}.py
│       ├─ schemas/{user,medicine,patient,prescription,sale}_schema.py
│       └─ utils/{email,seed}.py
└─ frontend/
    ├─ package.json
    ├─ nginx.conf
    ├─ vite.config.js
    └─ src/
        ├─ App.jsx               # routes + MUI theme
        ├─ main.jsx
        ├─ index.css
        ├─ components/Layout.jsx # AppBar + Drawer nav + logout
        ├─ context/AuthContext.jsx
        ├─ services/api.js       # axios instance + interceptors
        └─ pages/{Dashboard,Medicines,Patients,Prescriptions,Billing,Login,Register}.jsx
```

---

## 5. How to Build / Run / Operate

```powershell
# from repo root — build & start everything, detached
docker compose up -d --build

# follow backend logs (shows request log + sent/demo e-mail output)
docker compose logs -f backend

# apply a change to .env (env vars only) — recreate backend
docker compose up -d backend

# rebuild only the frontend (after UI edits)
docker compose up -d --build frontend

# stop / remove
docker compose down            # keep data volume
docker compose down -v         # WIPE database (re-runs init.sql next start)

# DB shell
docker compose exec -T db psql -U pharmacy_user -d pharmacy_db
# e.g. \dt   \d users   SELECT * FROM roles;
```

**Default admin:** username `admin` / password `admin123` (auto-seeded on first boot).

**Reset to a clean DB:** `docker compose down -v` then `docker compose up -d --build` — `init.sql` re-seeds roles/medicines/patients and the backend re-seeds the admin.

---

## 6. Backend — Deep Dive

### 6.1 `app/main.py`
- Creates `FastAPI(title="Pharmacy Management System API", ...)`.
- `lifespan()` (on startup): `Base.metadata.create_all(bind=engine)` (creates any missing tables from models) → `seed_roles(db)` → `seed_sample_data(db)` (if `SEED_DEMO_DATA`) → `seed_admin(db)`.
- `CORSMiddleware` allows `http://localhost:3000` (and 8000, etc.), all methods/headers.
- Routers mounted:
  - `/api/v1/auth` → `auth`
  - `/api/v1/users` → `users`
  - `/api/v1/patients` → `patients`
  - `/api/v1/medicines` → `medicines`
  - `/api/v1/prescriptions` → `prescriptions`
  - `/api/v1/sales` → `sales`
- `GET /` → `{message, status}`; `GET /health` → `{status:"healthy"}`.

### 6.2 Configuration — `core/config.py`
`Settings(BaseSettings)` with `SettingsConfigDict(env_file=".env", extra="ignore")`.
In Docker these values are injected as real env vars (from `docker-compose.yml` → `.env`).

| Setting | Default in code | Passed by compose |
|---|---|---|
| `DATABASE_URL` | `postgresql://pharmacy_user:pharmacy_pass@localhost:5432/pharmacy_db` | `...@db:5432/pharmacy_db` |
| `SECRET_KEY` | `change-this-secret-in-production-2026` | `your-secret-key-here-change-in-production` |
| `ALGORITHM` | `HS256` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | `30` |
| `ADMIN_USERNAME` | `admin` | (code default) |
| `ADMIN_PASSWORD` | `admin123` | (code default) |
| `ADMIN_EMAIL` | `admin@pharmacy.com` | (code default) |
| `OTP_EXPIRE_MINUTES` | `5` | (code default) |
| `OTP_DEBUG` | `True` | `${OTP_DEBUG:-true}` |
| `SMTP_HOST` | `""` | `${SMTP_HOST:-}` |
| `SMTP_PORT` | `587` | `${SMTP_PORT:-587}` |
| `SMTP_USER` / `SMTP_PASSWORD` | `""` | `${SMTP_USER:-}` / `${SMTP_PASSWORD:-}` |
| `SMTP_FROM` | `no-reply@pharmacy.com` | `${SMTP_FROM:-no-reply@pharmacy.com}` |
| `SMTP_TLS` | `True` | `${SMTP_TLS:-true}` |
| `GOOGLE_CLIENT_ID` | `""` | `${GOOGLE_CLIENT_ID:-}` |
| `GOOGLE_DEFAULT_ROLE_ID` | `2` (Customer) | `${GOOGLE_DEFAULT_ROLE_ID:-2}` |
| `SEED_DEMO_DATA` | `True` | (code default) |

### 6.3 Security — `core/security.py`
- `hash_password(pw)` / `verify_password(pw, hash)` — **bcrypt**.
- `create_access_token(subject, expires_delta=None)` — JWT `{ "sub": subject, "exp": ... }`, HS256, expiry = `ACCESS_TOKEN_EXPIRE_MINUTES`.
- `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")`.
- `get_role_name(db, role_id)` → role name or `None`.
- `get_current_user(token, db)` — decodes JWT, loads `User` by **username** (`sub`); raises 401 `CREDENTIALS_EXCEPTION` on failure.
- `require_roles(*names)` — dependency factory; returns current user if their role name ∈ names, else **403**.

### 6.4 Database — `core/database.py`
```python
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
def get_db(): ...  # yields a Session, closes after
```

### 6.5 Data Models (SQLAlchemy)

**`models/models.py`**
- `Role` → table `roles`: `id` (int PK), `name` (uniq), `description`, `created_at`.
- `User` → table `users`: `id` UUID PK, `username` (uniq), `email` (uniq), `password_hash`, `first_name`, `last_name`, `role_id` → `roles.id`, `is_active`, **`otp_code`** (varchar 6), **`otp_expires_at`** (datetime), `created_at`, `updated_at`; `relationship("Role")`.
- `Patient` → `patients`: `id` UUID PK, `patient_id` (uniq, e.g. `PAT001`), `first_name`, `last_name`, `date_of_birth`, `gender`, `phone`, `email`, `address`, `insurance_number`, `insurance_provider`, `emergency_contact`, `medical_history`, timestamps.
- `Medicine` → `medicines`: `id` UUID PK, `medicine_code` (uniq), `name`, `generic_name`, `manufacturer`, `dosage_form`, `strength`, `unit_price`, `purchase_price`, `quantity_in_stock`, `minimum_stock_level`, `maximum_stock_level`, `batch_number`, `manufacture_date`, `expiry_date`, `storage_location`, `is_active`, timestamps.

**`models/sales_models.py`**
- `Prescription` → `prescriptions`: `id`, `prescription_number` (uniq), `patient_id`→patients, `doctor_name`, `doctor_license`, `diagnosis`, `issue_date`, `expiry_date`, `status` (default `Pending`), `prescribed_by`→users, timestamps.
- `PrescriptionItem` → `prescription_items`: `id`, `prescription_id`→prescriptions (CASCADE), `medicine_id`→medicines, `quantity_prescribed`, `quantity_dispensed`, `dosage_instructions`, `created_at`.
- `Sale` → `sales`: `id`, `bill_number` (uniq), `patient_id`→patients, `cashier_id`→users, `total_amount`, `discount_amount`, `tax_amount`, `net_amount`, `payment_method`, `payment_status` (default `Paid`), `sale_date`, `notes`.
- `SaleItem` → `sale_items`: `id`, `sale_id`→sales (CASCADE), `medicine_id`→medicines, `quantity`, `unit_price`, `subtotal`.
- `ActivityLog` → `activity_logs`: `id`, `user_id`→users, `action`, `module`, `details`, `ip_address`, `user_agent`, `created_at`.
- `Notification` → `notifications`: `id`, `title`, `message`, `type`, `is_read`, `related_entity_type`, `related_entity_id`, `created_at`.

### 6.6 Pydantic Schemas (Pydantic v2, `from_attributes=True` on ORM-facing models)

**`user_schema.py`**
- `UserBase(username, email:EmailStr, first_name, last_name)`
- `UserCreate(UserBase + password, role_id:Optional[int])`
- `UserUpdate(email?, first_name?, last_name?, password?, role_id?, is_active?)`
- `UserOut(UserBase + id:UUID, role_id, role_name, is_active, created_at)`
- `Token(access_token, token_type="bearer")`
- `OTPRequest(identifier:str)`, `OTPVerify(username:str, otp:str)`, `OTPResponse(message, email_sent, debug_otp:Optional)`
- `GoogleLogin(credential:str)`, `GoogleConfig(enabled:bool, client_id:str)`

**`medicine_schema.py`** — `MedicineBase` (medicine_code, name, …, unit_price, purchase_price, quantity_in_stock=0, minimum_stock_level=10, maximum_stock_level=1000, expiry_date required, is_active), `MedicineCreate`, `MedicineUpdate` (all optional), `Medicine(+id, created_at, updated_at)`.

**`patient_schema.py`** — `PatientBase` (patient_id, first_name, last_name, date_of_birth required; rest optional), `PatientCreate`, `PatientUpdate`, `Patient(id, created_at, updated_at)`.

**`prescription_schema.py`** — `PrescriptionItemBase/Create/…`, `PrescriptionBase(patient_id, doctor_name, doctor_license?, diagnosis?, issue_date?, expiry_date?, status='Pending', prescribed_by?)`, `PrescriptionCreate(+prescription_number?, items:List[])`, `PrescriptionUpdate(...)`, `Prescription(+id, prescription_number, created_at, updated_at)`.

**`sale_schema.py`**
- `SaleItemBase(medicine_id:UUID, quantity:int, unit_price:float, subtotal:float)`
- `SaleBase(patient_id:UUID, cashier_id:UUID, total_amount:float, discount_amount=0, tax_amount=0, net_amount:float, payment_method:str, payment_status="Paid", notes:Optional)`
- `SaleCreate(SaleBase + bill_number:Optional, items:List[SaleItemCreate]=[])`
- `Sale(SaleBase + id, bill_number, sale_date)`

### 6.7 CRUD layer
- `crud_user.py`: `get_user`, `get_user_by_username`, `get_user_by_email`, `get_users`, `create_user(hashes pw)`, `update_user(hashes pw if provided)`, `delete_user`.
- `crud_medicine.py`: `get_medicine`, `get_medicine_by_code`, `get_medicines`, `get_low_stock_medicines` (`qty <= min`), `get_expiring_soon_medicines` (`expiry <= today+30d` and `>= today`), `create/update/delete_medicine`.
- `crud_patient.py`: `get_patient`, `get_patient_by_patient_id`, `get_patients`, `create/update/delete_patient`.
- `crud_prescription.py`: `generate_prescription_number` (`RX-YYYYMMDD-NNNN`), `get_prescriptions`, `get_prescription`, `create_prescription` (creates header + items), `update_prescription`, `delete_prescription`.
- `crud_sale.py`: `generate_bill_number` (`BILL-YYYYMMDD-NNNN`), `get_sales`, `get_sale`, `create_sale` (creates header + items, **decrements medicine stock**, logs activity), `log_activity`.

### 6.8 API Endpoints (full reference)

> Base prefix: `/api/v1`. All endpoints **except** `auth` require a valid Bearer JWT
> (`medicines`, `patients`, `prescriptions`, `sales` enforce it at the router level).

#### Auth — `/api/v1/auth` (`auth.py`)
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/login` | none | form `username`, `password` (username **or** e-mail) | `Token` |
| POST | `/register` | none | `UserCreate` JSON | `UserOut` (201) |
| GET | `/me` | JWT | — | `UserOut` |
| POST | `/request-otp` | none | `{ identifier }` | `OTPResponse {message, email_sent, debug_otp}` |
| POST | `/verify-otp` | none | `{ username, otp }` | `Token` |
| GET | `/google/config` | none | — | `GoogleConfig {enabled, client_id}` |
| POST | `/google` | none | `{ credential }` (Google ID token) | `Token` (or 501 if not configured) |

Helper `_resolve_user(db, identifier)` → e-mail lookup if identifier contains `@`, else username lookup.

`register` errors: 400 `Username already registered` / `Email already registered` / `Invalid role_id`.

`request-otp`: 404 `No active account found for that username/e-mail`; generates `f"{randint(0,999999):06d}"`, stores with `otp_expires_at = now + OTP_EXPIRE_MINUTES`, e-mails it.
`verify-otp`: 401 on invalid/expired/no-OTP; on success clears OTP and returns a token.

#### Users — `/api/v1/users` (`users.py`) — **role `Manager` required**
| Method | Path | Notes |
|---|---|---|
| GET | `/` | list (`skip`, `limit`) |
| GET | `/{user_id}` | one user |
| PUT | `/{user_id}` | `UserUpdate` |
| DELETE | `/{user_id}` | delete |
| GET | `/me/profile` | current user (any authenticated role) |

#### Medicines — `/api/v1/medicines` (`medicines.py`) — any authenticated user
`GET /` (`skip,limit`) · `POST /` (400 if `medicine_code` exists) · `GET /low-stock/` · `GET /expiring-soon/` · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`

#### Patients — `/api/v1/patients` (`patients.py`) — any authenticated user
`GET /` · `POST /` (400 if `patient_id` exists) · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`

#### Prescriptions — `/api/v1/prescriptions` (`prescriptions.py`) — any authenticated user
`GET /` · **`POST /`** (sets `prescribed_by = current_user.id`, creates Rx, **e-mails patient**) · `GET /{id}` · `PUT /{id}` · `DELETE /{id}`

#### Sales — `/api/v1/sales` (`sales.py`) — any authenticated user
`GET /` · **`POST /`** (creates sale with `cashier_id = current_user.id`, **e-mails bill to patient**) · `GET /{id}`

### 6.9 Seeding — `utils/seed.py`
- `seed_roles()` → inserts **`Manager`**, **`Customer`** (idempotent by name).
- `seed_admin()` → creates `admin` (Manager) if absent, e-mail `settings.ADMIN_EMAIL`, bcrypt-hashed.
- `seed_sample_data()` → only if no medicines/patients exist; inserts 10 medicines and 3 patients (see §11).

---

## 7. Frontend — Deep Dive

### 7.1 Routing & Theme — `App.jsx`
- MUI theme: primary `#2e7d32`, secondary `#1976d2`.
- `AuthProvider` wraps `Router`.
- Routes:
  - `/login` → `Login`
  - `/register` → `Register`
  - `/` → `ProtectedLayout` (redirects to `/login` when `user == null`) → `Layout` with children: index `Dashboard`, `medicines`, `patients`, `prescriptions`, `billing`.

### 7.2 State — `context/AuthContext.jsx`
- `user` loaded from `localStorage['pms_user']`.
- `login(username, password)` → posts **form-urlencoded** to `/auth/login`, saves `pms_token`, hydrates via `GET /auth/me`, saves `pms_user`.
- `requestOtp(identifier)` → `POST /auth/request-otp` → returns `{ message, email_sent, debug_otp }`.
- `verifyOtp(username, otp)` → `POST /auth/verify-otp`, saves token, hydrates.
- `register(payload)` → `POST /auth/register`.
- `googleLogin(credential)` → `POST /auth/google`, saves token, hydrates.
- `logout()` → clears storage, redirects to `/login`.

### 7.3 HTTP layer — `services/api.js`
- `axios.create({ baseURL: '/api/v1' })`.
- **Request interceptor**: adds `Authorization: Bearer <pms_token>`.
- **Response interceptor**: on `401` clears storage and redirects to `/login` (unless already there).

### 7.4 Pages (one by one)

**`Login.jsx`** — `Paper` card, `Tabs` = **Password** | **OTP**.
- Password tab: “Username or E-mail” + “Password” → **Sign In**.
- OTP tab: identifier → **Send OTP** (`requestOtp`) → 6-digit field → **Verify & Sign In** (`verifyOtp`); **Change account / resend**; if `debug_otp` present it pre-fills (demo only — currently `null` in real mode).
- Google button rendered **only if** `/auth/google/config` returns `enabled:true`; GSI script loaded dynamically.
- Bottom: full-width outlined **“New user? Sign Up”** → `/register`.

**`Register.jsx`** — fields: first/last name, username, e-mail, password + confirm, **Role select** = `Customer (2)` [default] / `Admin (Manager) (1)`. Client validation: passwords match + min length 6. On success → auto `login()` → navigate `/`. Bottom: outlined **“Already registered? Sign In”** → `/login`.

**`Layout.jsx`** — MUI `AppBar` + permanent `Drawer` (Dashboard, Medicines, Patients, Prescriptions, Billing), responsive temporary drawer on mobile, logout button.

**`Dashboard.jsx`** — gradient stat cards (Total Medicines, Total Patients, Low Stock Alerts, Expiring Soon) computed from `GET /medicines/`, `/patients/`, `/medicines/low-stock/`, `/medicines/expiring-soon/`; plus two side-by-side panels listing **Low Stock** and **Expiring Soon** medicines (reuses already-fetched arrays, no extra API calls).

**`Medicines.jsx`** — `DataGrid` (Code, Name, Generic, Manufacturer, Price(₹), Stock, Expiry, Actions). Add/Edit `Dialog` with all medicine fields + MUI `DatePicker` (dayjs). Delete confirm. Snackbar feedback. Calls `GET/POST/PUT/DELETE /medicines/`.

**`Patients.jsx`** — `DataGrid` (Patient ID, First, Last, DOB, Gender, Phone, Actions). Add/Edit `Dialog` with all patient fields (gender `MenuItem`, date via `DatePicker`). Calls `GET/POST/PUT/DELETE /patients/`.

**`Prescriptions.jsx`** — `DataGrid` (RX#, Doctor, Diagnosis, Status chip, Issue Date, **Actions**). New Rx `Dialog`: patient select, status, doctor name/license, issue date, diagnosis, and a mini item-builder (medicine + qty + dosage → **Add**, removable table). `save()` posts to `/prescriptions/` (sends `prescribed_by: user.id`; backend also sets it) → backend e-mails the patient. (Note: client also sends `prescription_number: 'RX-'+Date.now()` which the backend overrides with its own generator.) **Actions** column adds 3D **Edit** (dialog → `PUT /prescriptions/{id}` with doctor/license/diagnosis/issue/expiry/status) and **Delete** (confirm dialog → `DELETE /prescriptions/{id}`) — both Manager-only.

**`Billing.jsx`** — `DataGrid` (Bill#, Patient, Net(₹), Pay, Date). New Bill `Dialog`: patient + payment method (Cash/Card/UPI) + discount + tax, mini item-builder (medicine + qty → computes `subtotal = qty × unit_price`), live **Total / Net**. `save()` posts to `/sales/` with `cashier_id: user.id` → backend generates `bill_number`, decrements stock, and e-mails the bill to the patient. (Client also sends a `bill_number` which backend overrides.)

---

## 8. Authentication & Authorization

- **JWT bearer** everywhere. Token carries `sub = username`.
- `get_current_user` resolves the user from `sub`.
- **Password login** supports username **or** e-mail (`_resolve_user`).
- **OTP login**: request (e-mail) → verify → token.
- **Registration**: public; creates user with a chosen `role_id` (Customer default).
- **Google Sign-In**: `POST /auth/google` verifies the Google ID token against `GOOGLE_CLIENT_ID`, finds or creates a user (default role `GOOGLE_DEFAULT_ROLE_ID`), returns JWT. Currently **disabled** (`GOOGLE_CLIENT_ID` empty).

**Authorization** — router-level JWT on all resource modules; `/users/*` additionally `require_roles("Manager")`.

---

## 8bis. Roles & RBAC
- Exactly **two roles now**: **`Manager` (id 1)** and **`Customer` (id 2)**.
- Frontend **hard-codes** these ids in the Register role dropdown.
- Backend enforces by **name** (`require_roles("Manager")`), so ids are a convenience, names are the contract.
- Only `/users/*` is Manager-gated. All resource routes currently allow any authenticated role (incl. Customer) — **open item** (see §14).

---

## 9. Authentication Flows (step sequences)

**Password login**
1. UI → `POST /auth/login` (form) → backend `_resolve_user` → bcrypt verify → JWT.
2. Store token; `GET /auth/me` → user object in context.

**OTP login**
1. `POST /auth/request-otp {identifier}` → looks up user, generates 6-digit code, stores it, `send_otp_email(user.email, otp)`.
2. User reads code from inbox → `POST /verify-otp { username, otp }` → token.

**Registration**
1. `POST /auth/register` → creates user (role from select; default Customer) → frontend auto-logs in.

**Bill e-mail (automatic)**
1. `Billing.jsx` → `POST /sales/` (patient, items, totals).
2. `sales.create_sale` → creates `Sale` + `SaleItem`s, decrements stock, `_email_bill()`.
3. `_email_bill` loads patient e-mail + medicine names → `send_bill_email()` → SMTP.

**Prescription e-mail** — analogous via `prescriptions.py::create_prescription` → `_email_prescription()` → `send_prescription_email`.

---

## 8b. End-to-End Verification Log (what was actually tested & passed)

> Commands were run from the host (PowerShell) / inside the `backend` container.

1. **Stack up** — `docker compose up -d --build` → 3 containers started; `db` healthy; `GET /health` → `{"status":"healthy"}`.
2. **Auth enforced** — unauthenticated `GET /api/v1/medicines/` → `401`; with Bearer → `200`.
3. **Login** — `POST /auth/login` (admin/admin123) → `200` + token; `GET /auth/me` → `200`.
4. **Registration** — `POST /auth/register` with `role_id=2` → `201`, role `Customer`; duplicate e-mail → `400`.
5. **OTP (real e-mail)** — `POST /auth/request-otp {identifier:"harshilpatel2992005@gmail.com"}` → `{"message":"OTP sent to your registered e-mail.","email_sent":true,"debug_otp":null}`.
6. **Bill e-mail** — created patient `PAT004 Harshil Patel <harshilpatel2992005@gmail.com>` + sale `BILL-20261012-0003` → backend e-mailed the bill to that address.
7. **Prescription e-mail** — `POST /prescriptions/` → `RX-20261012-0002` e-mailed to patient.
8. **SMTP proof** — `curl`/`smtplib` login to `smtp.gmail.com:587` → `235 2.7.0 Accepted`; app `send_email(...)` → `True`.
9. **Roles** — DB `SELECT id,name FROM roles` → `1 Manager`, `2 Customer`.
10. **Health after config change** — backend recreated → `GET /health` → `{"status":"healthy"}`.

Test data left in DB (optional to keep for screenshots): patient `PAT004`, sale `BILL-20261012-0003`, and an earlier `RX-…-0002`.

---

## 8.5 Bugs Found & Fixed (detailed)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Login succeeded at API but UI crashed / `/auth/me` 500 | Seeded admin e-mail `admin@pharmacy.local` fails Pydantic `EmailStr` (`.local` is a reserved TLD) | Changed `ADMIN_EMAIL` → `admin@pharmacy.com`; ran `UPDATE users SET email='admin@pharmacy.com' WHERE username='admin'` |
| 2 | API resources were publicly readable/writable without login | Resource routers had no auth dependency | Added `APIRouter(dependencies=[Depends(get_current_user)])` to medicines/patients/prescriptions/sales |
| 3 | Compose warning about obsolete key | leftover `version: '3.8'` | removed |
| 4 | `docker-compose` engine stuck / not responding | Docker Desktop engine in bad state | Restarted Docker Desktop; engine came up (`29.8.2`), stack rebuilt healthy |
| 5 | Google signup would break (FK) | `GOOGLE_DEFAULT_ROLE_ID = 4` referenced the deleted Cashier role | set to `2` (Customer) in `config.py`, `docker-compose.yml`, `.env` |
| 6 | SMTP login “Connection unexpectedly closed” | Actually Gmail **`535 BadCredentials`**; smtplib retried AUTH and the server closed the socket | Used a valid Gmail **App Password**; verified via `curl` (`235 Accepted`) |

### Implementation notes / gotchas
- Gmail App Passwords must be entered **without spaces** (16 lowercase letters).
- `.local` and some TLDs are rejected by `EmailStr`.
- `SMTP` AUTH over port 587 with STARTTLS; server closes socket after repeated bad AUTH (hence the misleading disconnect error).
- Docker Desktop MTU was **not** the issue here (TCP + TLS handshake both succeeded).
- Frontend sends `bill_number` / `prescription_number`, but the **backend generates its own** (`BILL-/RX-YYYYMMDD-NNNN`) — the client values are ignored. Worth cleaning up.
- `SaleBase.cashier_id` is **required** in the schema (endpoint overrides it with the current user anyway).
- `Prescriptions.save()` sends `prescribed_by: user.id`; endpoint also sets it from the token.

---

## 9.5 Configuration / `.env` (current)

```ini
# E-mail / SMTP (real OTP + bill/prescription e-mails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=harshilpatel2992005@gmail.com
SMTP_PASSWORD=<16-char Gmail App Password>   # SECRET — do not commit
SMTP_FROM=harshilpatel2992005@gmail.com
SMTP_TLS=true
OTP_DEBUG=false          # real mode: OTP e-mailed, NOT returned by API

# Google Sign-In (enabled 31 Oct 2026)
GOOGLE_CLIENT_ID=376890058742-0tref41s8hhsrmppgu011m19t9v383lv.apps.googleusercontent.com
GOOGLE_DEFAULT_ROLE_ID=2
```

> ⚠️ Revoke the App Password (Google Account → Security → App passwords) before
> submitting, and add `.env` to `.gitignore` if a git repo is created.

---

## 10. E-mail Subsystem — `utils/email.py`

Functions:
- `smtp_configured() -> bool` = `bool(settings.SMTP_HOST)`.
- `send_email(to, subject, body) -> bool` — SMTP path: `smtplib.SMTP(host, port)` + optional `starttls()` + optional `login(user, pw)` + `send_message`; returns `True` on success. If SMTP not configured → **demo mode**: logs + prints `[DEMO EMAIL] ...` and returns `False`. Wrapped in try/except (returns `False` on error, never raises).
- `send_otp_email(to, otp)` — subject “PharmaMS – Your login OTP”, TTL text from `OTP_EXPIRE_MINUTES`.
- `send_bill_email(to, bill: dict)` — formatted receipt: bill no, patient, date, item table (name/qty/amount), subtotal/discount/tax/**NET**, payment method/status, footer.
- `send_prescription_email(to, rx: dict)` — Rx no, patient, doctor, issue date, status, medicine list with qty + dosage, footer.

Wiring (best-effort; failures never break the request):
- `auth.request_otp` → `send_otp_email(user.email, otp)`.
- `sales.create_sale` → `_email_bill(db, sale)` (joins patient + medicine names).
- `prescriptions.create_prescription` → `_email_prescription(db, rx)` (joins patient + medicine names).

---

## 11. Database — Full Schema & Seed

### 11.1 Tables (created by `database/init.sql`, `PostgreSQL 15`)
`roles`, `users`, `patients`, `medicines`, `prescriptions`, `prescription_items`, `sales`, `sale_items`, `activity_logs`, `notifications`. Extension: `uuid-ossp`.

**`roles`**: `id SERIAL PK`, `name VARCHAR(50) UNIQUE NOT NULL`, `description VARCHAR(255)`, `created_at TIMESTAMP`.

**`users`**: `id UUID PK DEFAULT uuid_generate_v4()`, `username VARCHAR(50) UNIQUE`, `email VARCHAR(100) UNIQUE`, `password_hash VARCHAR(255)`, `first_name`, `last_name`, `role_id INTEGER REFERENCES roles(id)`, `is_active BOOLEAN DEFAULT TRUE`, **`otp_code VARCHAR(6)`**, **`otp_expires_at TIMESTAMP`**, `created_at`, `updated_at`. Indexes on username, email.

**`patients`**: `id UUID PK`, `patient_id VARCHAR(20) UNIQUE`, `first_name`, `last_name`, `date_of_birth DATE NOT NULL`, `gender VARCHAR(10)`, `phone VARCHAR(20)`, `email VARCHAR(100)`, `address TEXT`, `insurance_number VARCHAR(50)`, `insurance_provider VARCHAR(100)`, `emergency_contact VARCHAR(20)`, `medical_history TEXT`, timestamps. Index on patient_id.

**`medicines`**: `id UUID PK`, `medicine_code VARCHAR(20) UNIQUE`, `name VARCHAR(100)`, `generic_name`, `manufacturer`, `dosage_form`, `strength`, `unit_price DECIMAL(10,2)`, `purchase_price DECIMAL(10,2)`, `quantity_in_stock INT`, `minimum_stock_level INT`, `maximum_stock_level INT`, `batch_number`, `manufacture_date DATE`, `expiry_date DATE NOT NULL`, `storage_location`, `is_active BOOLEAN`, timestamps. Indexes on code, name, expiry_date.

**`prescriptions`**: `id UUID PK`, `prescription_number VARCHAR(20) UNIQUE`, `patient_id UUID REFERENCES patients(id)`, `doctor_name`, `doctor_license`, `diagnosis TEXT`, `issue_date DATE`, `expiry_date DATE`, `status VARCHAR(20) DEFAULT 'Pending'`, `prescribed_by UUID REFERENCES users(id)`, timestamps. Index on prescription_number.

**`prescription_items`**: `id UUID PK`, `prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE`, `medicine_id UUID REFERENCES medicines(id)`, `quantity_prescribed INT`, `quantity_dispensed INT DEFAULT 0`, `dosage_instructions TEXT`, `created_at`.

**`sales`**: `id UUID PK`, `bill_number VARCHAR(20) UNIQUE`, `patient_id UUID REFERENCES patients(id)`, `cashier_id UUID REFERENCES users(id)`, `total_amount DECIMAL(10,2)`, `discount_amount DECIMAL(10,2) DEFAULT 0`, `tax_amount DECIMAL(10,2) DEFAULT 0`, `net_amount DECIMAL(10,2)`, `payment_method VARCHAR(20)`, `payment_status VARCHAR(20) DEFAULT 'Paid'`, `sale_date TIMESTAMP`, `notes TEXT`. Index on bill_number.

**`sale_items`**: `id UUID PK`, `sale_id UUID REFERENCES sales(id) ON DELETE CASCADE`, `medicine_id UUID REFERENCES medicines(id)`, `quantity INT`, `unit_price DECIMAL(10,2)`, `subtotal DECIMAL(10,2)`.

**`activity_logs`**: `id UUID PK`, `user_id UUID REFERENCES users(id) ON DELETE SET NULL`, `action VARCHAR(100)`, `module VARCHAR(50)`, `details TEXT`, `ip_address VARCHAR(45)`, `user_agent TEXT`, `created_at`.

**`notifications`**: `id UUID PK`, `title VARCHAR(255)`, `message TEXT`, `type VARCHAR(20) DEFAULT 'Info'`, `is_read INT DEFAULT 0`, `related_entity_type VARCHAR(50)`, `related_entity_id UUID`, `created_at`.

### 11.2 Seed data (`init.sql` + `seed.py`)
Roles: `Manager`, `Customer`.

10 medicines (`MED001…MED010`): Paracetamol 500mg, Amoxicillin 250mg, Amoxicillin 500mg, Azithromycin 500mg, Metformin 500mg, Amlodipine 5mg, Cetirizine 10mg, Insulin Glargine, Ibuprofen 400mg, Omeprazole 20mg — with unit/purchase price, stock, min/max, batch, expiry offsets (e.g. +25d, +75d → trigger “expiring soon”), storage location.

3 patients: `PAT001 Ramesh Patel` (ramesh.p@gmail.com), `PAT002 Sarla Shah` (sarla.shah@yahoo.com), `PAT003 Vikas Desai` (vikas.desai@gmail.com). Plus test `PAT004 Harshil Patel` (real Gmail) added during verification.

Admin: `admin` (Manager, `admin@pharmacy.com`).

### 11.3 Runtime migrations applied (because init.sql only runs on a fresh volume)
- Added `users.otp_code`, `users.otp_expires_at`.
- Role consolidation: renamed/created `Customer`, remapped users, deleted extra roles, forced `Customer.id = 2`, reset `roles_id_seq`.

---

## 12. Authentication Flows (as implemented)
*(kept here too for quick reference — see §8 for the full table)*

1. **Password** — `POST /auth/login` (form) → JWT (identifier can be username or e-mail).
2. **OTP** — `POST /auth/request-otp {identifier}` → e-mail → `POST /auth/verify-otp {username, otp}` → JWT.
3. **Register** — `POST /auth/register` → `UserOut` → client auto-login.
4. **Google** — `POST /auth/google {credential}` → verify ID token → find/create user → token.

---

## 12.5 Roles & RBAC

- Exactly **two roles**: `Manager` (id 1) and `Customer` (id 2).
- Backend enforces by **name** via `require_roles("Manager")` (only on `/users/*`).
- Resource routes require only a valid login.
- Frontend hard-codes `1 = Manager`, `2 = Customer` in the registration role select.

---

## 13. Current State, Limitations & Open Items (roadmap for next phase)

**Working & verified**
- 3 healthy containers; UI `:3000`; API `:8000`; Swagger available.
- Password login, OTP login (real Gmail), self-registration (Customer).
- Automatic bill e-mail + prescription e-mail to the patient.
- Roles reduced to Manager + Customer; auth enforced on all resource routers.

**Open items / TODO**
1. ~~**Fine-grained RBAC**~~ — **DONE**. `require_roles("Manager")` gates writes on medicines/patients/prescriptions/sales; reads scoped to own records for Customer (verified 403/200 via curl).
2. ~~**Customer experience**~~ — **DONE**. New `frontend/src/pages/MyRecords.jsx` ("My Bills"/"My Prescriptions" tabs) + `/records` route; nav shows Customer only Dashboard/Medicines/My Records.
3. ~~**Google Sign-In**~~ — **DONE (12 Oct 2026)**. OAuth Client ID created on Google Auth Platform (Web application, JS origin `http://localhost:3000`); `GOOGLE_CLIENT_ID` set in `.env`; backend recreated. `GET /api/v1/auth/google/config` → `{enabled:true, client_id:...}`. Consent screen in **Testing** mode → only Test users (Gmail added) can sign in.
4. **User-management UI** — `/users/*` API exists but there’s no admin screen.
5. **No admin-initiated “create Manager”** flow (registration is the only creation path).
6. **Client-generated ids** (`bill_number`, `prescription_number`) are ignored by the backend — clean up the frontend payloads.
7. **Secret hygiene** — `.env` holds a live App Password; add `.gitignore`, revoke before submission.
8. ~~**Reports**~~ — **DONE (31 Oct 2026)**. `Report_2_Status_Review_2` and `Report_3_Final_Documentation` fully regenerated (both `.docx` + `.pdf`) with the 2-role model, RBAC matrix, e-mail/OTP subsystem, My Records module and updated tests; diagrams + screenshots re-embedded (R2: 5 imgs/9 pp; R3: 11 imgs/36 pp). Generators: `%TEMP%\opencode\gen_report2.py`, `gen_report3.py`.
9. **README / guide.md** may still mention demo-mode OTP; update with real-SMTP steps.
10. **Lint** not run on the frontend since the latest UI edits (`npm run lint`).
11. ~~**Dashboard + Prescriptions UI upgrade**~~ — **DONE**. Dashboard rewritten (gradient stat cards + Low Stock / Expiring Soon panels). Prescriptions gained Edit/Delete actions column with dialogs; verified end-to-end via API (create → PUT including `doctor_license`/`issue_date` → DELETE → 404). `prescription_schema.PrescriptionUpdate` extended with `doctor_license` + `issue_date`. Frontend rebuilt & passing.

---

## 14. Changelog — Files Touched (this phase)

| File | Change |
|---|---|
| `backend/app/utils/email.py` | Rewritten → generic `send_email` + `send_otp_email`, `send_bill_email`, `send_prescription_email` |
| `backend/app/api/v1/endpoints/sales.py` | +`_email_bill()` on `create_sale`; router-level auth |
| `backend/app/api/v1/endpoints/prescriptions.py` | +`_email_prescription()` on `create_prescription`; router-level auth |
| `backend/app/api/v1/endpoints/auth.py` | `_resolve_user`; register; `request-otp`/`verify-otp`; Google config/login |
| `backend/app/api/v1/endpoints/{medicines,patients}.py` | router-level auth dependency |
| `backend/app/api/v1/endpoints/users.py` | Manager-only user management |
| `backend/app/core/config.py` | OTP/SMTP/Google settings; `ADMIN_EMAIL`; `GOOGLE_DEFAULT_ROLE_ID=2` |
| `backend/app/core/security.py` | JWT/bcrypt, `get_current_user`, `require_roles` |
| `backend/app/models/models.py` | `User.otp_code`, `User.otp_expires_at` |
| `backend/app/schemas/user_schema.py` | OTP + Google schemas |
| `backend/app/utils/seed.py` | roles → Manager/Customer |
| `backend/requirements.txt` | +`google-auth==2.25.2` |
| `database/init.sql` | roles seed → Manager/Customer |
| `docker-compose.yml` | SMTP/Google `${VAR}` wiring; removed `version`; Google role default 2 |
| `.env` | new — SMTP (Gmail), `OTP_DEBUG=false`, Google vars |
| `frontend/src/pages/Login.jsx` | Password/OTP tabs; Google button; “New user? Sign Up” |
| `frontend/src/pages/Register.jsx` | new page; role select Customer/Manager; “Already registered? Sign In” |
| `frontend/src/context/AuthContext.jsx` | `requestOtp`,`verifyOtp`,`register`,`googleLogin` |
| `frontend/src/services/api.js` | axios instance + bearer/401 interceptors |
| `frontend/src/App.jsx` | `/login`, `/register`, protected layout |
| `frontend/src/components/Layout.jsx` | role-filtered nav (`Billing`/`Patients`/`Prescriptions` = Manager only; `My Records` = Customer) |
| `frontend/src/pages/MyRecords.jsx` | new customer self-service page (`/records`) |
| `backend/app/schemas/sale_schema.py` | +`SaleItemOut`, `SaleOut` (patient_name/patient_email/items), `SendEmailResult` |
| `backend/app/api/v1/endpoints/sales.py` | `_email_bill` returns bool; `_serialize_sale`; `GET /{id}` returns items; new **Manager-only** `POST /{id}/send-email` (resend bill) |
| `frontend/src/pages/Billing.jsx` | full redesign: 3D press buttons, header, patient avatar/email, **View Bill** receipt modal, **Send to Customer** action + snackbar |
| `frontend/src/pages/Dashboard.jsx` | redesigned: gradient stat cards + side-by-side **Low Stock** / **Expiring Soon** panels (reuses data already fetched; no new API calls) |
| `frontend/src/pages/Prescriptions.jsx` | +**Actions** column (3D Edit/Delete), edit dialog (doctor name/license, diagnosis, issue/expiry dates, status → `PUT /prescriptions/{id}`) and delete-confirm dialog (`DELETE /prescriptions/{id}`); New-Prescription dialog preserved |
| `backend/app/schemas/prescription_schema.py` | `PrescriptionUpdate` + `doctor_license`, `issue_date` (were missing → edits silently dropped) |
| `.env` | `GOOGLE_CLIENT_ID` set (Google Sign-In enabled) |
| `progress.md` | this document |

---

## 15. Quick Reference

- **Admin login:** `admin` / `admin123`
- **Roles:** `1 = Manager`, `2 = Customer`
- **URLs:** UI `http://localhost:3000` · API `http://localhost:8000` · Docs `/docs`
- **Rebuild all:** `docker compose up -d --build`
- **Restart backend after `.env` change:** `docker compose up -d backend`
- **DB shell:** `docker compose exec -T db psql -U pharmacy_user -d pharmacy_db`
- **Wipe DB:** `docker compose down -v`

---

## 16. Glossary

- **OTP** — one-time password (6 digits, 5-min TTL), delivered by e-mail.
- **Manager** — admin role; full access + user management.
- **Customer** — patient/customer account (self-registered).
- **Demo mode** — SMTP unconfigured; e-mails printed to the server log instead of sent.
- **RBAC** — role-based access control (`require_roles(...)`).
- **GSI** — Google Identity Services (front-end Google Sign-In).
