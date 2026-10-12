# Pharmacy Management System (PMS-001) — Complete Setup & Run Guide

Ye guide bilkul shuru se bataati hai ki project ko apne Windows PC pe kaise chalana hai.
Do tarike hain:

- **Tarika A (recommended): Docker** — ek command me DB + backend + frontend sab chal jaate hain.
- **Tarika B: Docker ke bina** — Python + Node manually chalana.

Pehli baar karne ke liye **Part 1 → 6** follow karo.

---

## Part 0 — Project me kya kya hai

```
REPORT SPM/
├── backend/            # FastAPI (Python) REST API
│   ├── app/            # main.py, api/, crud/, models/, schemas/, core/, utils/
│   └── requirements.txt
├── frontend/           # React + Vite + Material-UI
│   ├── src/
│   ├── package.json
│   └── nginx.conf
├── database/
│   └── init.sql        # tables + seed data (auto-run on first DB start)
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docker-compose.yml  # 3 services: db, backend, frontend
├── Report_2_Status_Review_2.docx / .pdf
├── Report_3_Final_Documentation.docx / .pdf
└── guide.md            # ye file
```

**Login (default):** username `admin`, password `admin123`

---

## Part 1 — Docker kya hai (1 line)

Docker ek tool hai jo pura application (database, server, website) ko chhote "containers"
me pack karta hai, taaki har PC pe same tarike se chale — "mere PC pe to chal raha tha"
problem khatam.

Docker Desktop ko **WSL2 (Windows Subsystem for Linux)** chahiye. Isliye pehle WSL,
phir Docker.

---

## Part 2 — WSL2 install karo (ek hi baar)

> Ye kaam **Administrator** PowerShell me hota hai.

1. Windows key → type `powershell` → **Windows PowerShell** pe **right-click** →
   **Run as administrator** → Yes.
2. Chalao:
   ```powershell
   wsl --install
   ```
3. Ye Windows Subsystem for Linux + Ubuntu download karega. Aakhir me:
   **"The operation completed successfully."**
4. Usi window me Ubuntu ka first-time setup shuru hoga:
   - `Enter new UNIX username:` → `harshil` (chhote letters, **space nahi**) → Enter
   - `New password:` → password type karo (**screen pe kuch nahi dikhega — ye normal hai**)
     → Enter → dobara wahi password → Enter
   - Metrics ka sawaal aaye to `n` → Enter
   - `exit` type karke Enter (Ubuntu band)
5. **Computer restart karo.** (WSL2 activate hone ke liye zaruri.)

### Restart ke baad verify
Normal PowerShell me:
```powershell
wsl -l -v
```
Expected:
```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```
- VERSION `2` hona chahiye. Agar `1` ho: `wsl --set-version Ubuntu 2`

---

## Part 3 — Docker Desktop start karo

1. Start menu → **Docker Desktop** → open.
2. Neeche taskbar me whale 🐳 icon aayega. Jab tak woh **green ("Engine running")**
   na ho jaaye, wait karo (1–2 min).
3. Verify (normal PowerShell me):
   ```powershell
   docker version
   docker ps
   ```
   `docker ps` agar chhoti table dikhaye (khaali bhi) → ✅ engine ready.

---

## Part 4 — Project ko Docker se chalao

PowerShell me:
```powershell
cd "C:\Users\harshil patel\OneDrive\Desktop\REPORT SPM"
docker compose up --build
```

Pehli baar **5–10 min** lagenge (images download honge). Ready hone par aisa dikhega:
```
backend  | INFO:  Application startup complete.
frontend | ... nginx ... start worker process
```

Ye terminal khula chhod do.

### Browser me kholo
| Kya | URL |
|---|---|
| App (website) | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |

Login: **admin / admin123**

---

## Part 5 — Roj-marra ke Docker commands

| Kaam | Command |
|---|---|
| Start (foreground, logs dikhte hain) | `docker compose up --build` |
| Start (background) | `docker compose up -d --build` |
| Band karo | `docker compose down` |
| Band + DB data delete (fresh reset) | `docker compose down -v` |
| Logs dekho | `docker compose logs -f backend` |
| Containers dekho | `docker ps` |
| Sirf backend restart | `docker compose restart backend` |

> **Note:** `database/init.sql` sirf **pehli baar** chalta hai (jab DB volume khaali ho).
> Schema/seed badla ho to: `docker compose down -v` → phir `docker compose up --build`.

---

## Part 6 — Docker kaam kaise karta hai (samajhne ke liye)

```
        Browser (aapka PC)
              │  http://localhost:3000
              ▼
 ┌────────────────────────────────────────────────┐
 │ Docker Compose (internal network)               │
 │                                                 │
 │  frontend(nginx:80) ──/api/──► backend:8000 ──► db:5432
 │  React build serve      proxy     FastAPI       PostgreSQL
 │  host: 3000             host: 8000              host: 5432
 └────────────────────────────────────────────────┘
```

- **db** = PostgreSQL 15. Pehli baar `database/init.sql` se tables + sample data bante hain.
  Data `postgres_data` volume me safe rehta hai.
- **backend** = FastAPI/Uvicorn. `./backend` mount hai + `--reload`, so code badalne pe
  auto restart. DB se `db:5432` pe connect karta hai.
- **frontend** = React ka `dist/` build, jo nginx serve karta hai. nginx `/api/` ko
  andar `backend:8000` pe forward karta hai.

---

## Part 7 — Docker ke bina (local development) — advanced

DB ke liye PostgreSQL chahiye. Sabse aasaan: sirf DB Docker me chalao, baaki local:
```powershell
docker compose up -d db
```

**Backend (ek terminal):**
```powershell
cd "C:\Users\harshil patel\OneDrive\Desktop\REPORT SPM\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://pharmacy_user:pharmacy_pass@localhost:5432/pharmacy_db"
uvicorn app.main:app --reload
```

**Frontend (doosra terminal):**
```powershell
cd "C:\Users\harshil patel\OneDrive\Desktop\REPORT SPM\frontend"
npm install
npm run dev
```
App: http://localhost:5173 (Vite dev server). Backend: http://localhost:8000

> `npm run build` sirf production build banata hai (dist/), app run nahi karta.
> App chalane ke liye `npm run dev` (dev) ya Docker (prod) use karo.

---

## Part 8 — Troubleshooting

| Error / problem | Matlab / Fix |
|---|---|
| `Cannot read package.json` | `npm` command galat folder me chali. `frontend/` me jao. |
| `failed to connect ... dockerDesktopLinuxEngine` | Docker Desktop start nahi hua (Part 3). |
| `Docker Desktop - WSL not installed` | Part 2 karo (wsl --install + restart). |
| `wsl --install` me "requires elevation" | Admin PowerShell me chalao. |
| "Virtualization is not enabled" | BIOS me virtualization ON karo — Intel VT-x / AMD SVM. Task Manager → Performance → CPU → Virtualization = Enabled. |
| Port already in use (3000/8000/5432) | Woh port busy hai. Us process ko band karo ya `docker-compose.yml` me port badlo. |
| Build stuck / slow | Pehli baar normal hai (images download ho rahe hain). Internet check karo. |
| DB me purana data aa raha hai | `docker compose down -v` → `docker compose up --build`. |
| Naya user banana ho (Ubuntu) | PowerShell me `wsl` → Ubuntu khulega. |
| `wsl -l -v` me VERSION 1 | `wsl --set-version Ubuntu 2` |

---

## Part 9 — Sab kuch reset / clean up

```powershell
# Containers + network band karo
docker compose down

# Saath me DB ka data bhi delete (fresh start)
docker compose down -v

# Sab images delete (optional, jagah khaali karne ke liye)
docker system prune -a
```

---

## Part 10 — Quick Start (cheat sheet)

```powershell
# 1. Docker Desktop start karo (green whale)
# 2. Project folder
cd "C:\Users\harshil patel\OneDrive\Desktop\REPORT SPM"

# 3. Chalao
docker compose up --build

# 4. Browser
#    App   -> http://localhost:3000   (admin / admin123)
#    Docs  -> http://localhost:8000/docs
```

---

*Prepared for Software Project Management (3171609) — Pharmacy Management System (PMS-001).*
