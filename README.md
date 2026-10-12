# Pharmacy Management System - PMS-001
## Project Overview

A full-stack Pharmacy Management System built with React, FastAPI, PostgreSQL, and Docker. This system digitizes pharmacy operations including medicine inventory, prescriptions, patient management, billing, and role-based access control.

## Tech Stack

- **Frontend**: React 18 + Vite + Material-UI (MUI)
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

## Features

- ✅ Medicine Management (CRUD, stock tracking, low-stock alerts, expiry monitoring)
- ✅ Patient Management (Patient records with insurance details)
- ✅ Dashboard with real-time statistics and alerts
- ✅ Role-based access control (Manager, Pharmacist, Technician, Cashier)
- ✅ RESTful API architecture
- ✅ Responsive UI with Material Design

## Project Structure

\\\
pharmacy-management-system/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/ # API endpoints
│   │   ├── core/             # Core config, DB
│   │   ├── crud/             # Database operations
│   │   ├── models/           # SQLAlchemy models
│   │   └── schemas/          # Pydantic schemas
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   └── services/        # API services
├── database/               # DB init scripts
├── docker/                 # Dockerfiles
└── docker-compose.yml
\\\

## Getting Started

### Using Docker (Recommended)

1. Clone the repository
2. Navigate to project directory
3. Start all services:
   \\\ash
   docker-compose up --build
   \\\
4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs (Swagger): http://localhost:8000/docs

### Manual Setup

#### Backend Setup
\\\ash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
\\\

#### Frontend Setup
\\\ash
cd frontend
npm install
npm run dev
\\\

#### Database Setup
- Create PostgreSQL database
- Update DATABASE_URL in backend/app/core/config.py
- Run backend to auto-create tables or use database/init.sql

## Default Roles

- **Manager**: Full system access
- **Pharmacist**: Prescription and dispensing operations
- **Technician**: Inventory and stock management
- **Cashier**: Billing and POS operations

## Project Info

- **Project Code**: PMS-001
- **Subject**: Software Project Management (3171609)
- **Institution**: Saffrony Institute of Technology
- **Developer**: Patel Harshil (230390116015)
- **Date**: August 2026

## Development Timeline

As per project report - implemented foundation covering:
- M1: Requirement Analysis & Scope Definition ✅
- M2: System Architecture & Design (In Progress) - Basic structure implemented
- M3-M10: Planned for future sprints
