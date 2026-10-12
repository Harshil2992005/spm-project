import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    get_role_name,
    hash_password,
    verify_password,
)
from app.crud import crud_patient, crud_user
from app.models import models
from app.schemas import user_schema
from app.utils.email import send_otp_email

router = APIRouter()


def _to_out(db: Session, user: models.User) -> user_schema.UserOut:
    out = user_schema.UserOut.model_validate(user)
    out.role_name = get_role_name(db, user.role_id)
    return out


def _customer_role_id(db: Session) -> int:
    role = db.query(models.Role).filter(models.Role.name == "Customer").first()
    return role.id if role else settings.GOOGLE_DEFAULT_ROLE_ID


def _ensure_patient_profile(db: Session, user: models.User) -> None:
    """Every customer account gets a patient record (matched by e-mail) so that the
    bills / prescriptions the pharmacy issues to that e-mail show up in My Records."""
    if user.role_id != _customer_role_id(db) or not user.email:
        return
    if crud_patient.get_patient_by_email(db, user.email):
        return
    db.add(models.Patient(
        patient_id=crud_patient.next_patient_code(db),
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
    ))
    db.commit()


def _resolve_user(db: Session, identifier: str) -> models.User:
    """Look a user up by username, or by e-mail when the identifier contains '@'."""
    identifier = (identifier or "").strip()
    if "@" in identifier:
        return crud_user.get_user_by_email(db, identifier)
    return crud_user.get_user_by_username(db, identifier)


@router.post("/login", response_model=user_schema.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = _resolve_user(db, form_data.username)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/e-mail or password",
        )
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/e-mail or password",
        )
    return user_schema.Token(access_token=create_access_token(subject=user.username))


@router.post("/register", response_model=user_schema.UserOut, status_code=status.HTTP_201_CREATED)
def register(data: user_schema.UserCreate, db: Session = Depends(get_db)):
    if crud_user.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if crud_user.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    # Public sign-up always creates a Customer; Manager accounts are created by an admin only.
    data.role_id = _customer_role_id(db)
    user = crud_user.create_user(db, data)
    _ensure_patient_profile(db, user)
    return _to_out(db, user)


@router.get("/me", response_model=user_schema.UserOut)
def read_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _to_out(db, current_user)


@router.post("/request-otp", response_model=user_schema.OTPResponse)
def request_otp(data: user_schema.OTPRequest, db: Session = Depends(get_db)):
    """Generate a one-time code and e-mail it to the user.

    In demo mode (no SMTP configured) the code is logged and, when OTP_DEBUG is
    on, returned in the response so the flow can be tested locally."""
    user = _resolve_user(db, data.identifier)
    if user is None or not user.is_active:
        raise HTTPException(status_code=404, detail="No active account found for that username/e-mail")

    otp = f"{secrets.randbelow(1_000_000):06d}"
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    db.commit()

    sent = send_otp_email(user.email, otp)
    message = "OTP sent to your registered e-mail." if sent else (
        "SMTP is not configured - the OTP was written to the server log (demo mode)."
    )
    return user_schema.OTPResponse(
        message=message,
        email_sent=sent,
        debug_otp=otp if settings.OTP_DEBUG else None,
    )


@router.post("/verify-otp", response_model=user_schema.Token)
def verify_otp(data: user_schema.OTPVerify, db: Session = Depends(get_db)):
    """Verify a previously issued OTP and return an access token."""
    user = _resolve_user(db, data.username)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid OTP")

    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=401, detail="No OTP requested for this account")

    if datetime.utcnow() > user.otp_expires_at:
        user.otp_code = None
        user.otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=401, detail="OTP has expired, please request a new one")

    if str(data.otp).strip() != user.otp_code:
        raise HTTPException(status_code=401, detail="Invalid OTP")

    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    return user_schema.Token(access_token=create_access_token(subject=user.username))


def _unique_username(db: Session, base: str) -> str:
    base = "".join(c for c in base if c.isalnum() or c in "._-") or "user"
    candidate = base
    n = 1
    while crud_user.get_user_by_username(db, candidate):
        n += 1
        candidate = f"{base}{n}"
    return candidate


@router.get("/google/config", response_model=user_schema.GoogleConfig)
def google_config():
    """Tell the frontend whether Google Sign-In is configured and which client id to use."""
    return user_schema.GoogleConfig(
        enabled=bool(settings.GOOGLE_CLIENT_ID),
        client_id=settings.GOOGLE_CLIENT_ID,
    )


@router.post("/google", response_model=user_schema.Token)
def google_login(data: user_schema.GoogleLogin, db: Session = Depends(get_db)):
    """Verify a Google ID token, then find or create the matching user."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google Sign-In is not configured")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        claims = google_id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=30,  # tolerate small clock drift (Docker/WSL clocks lag)
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=501,
            detail=f"Google authentication dependency is missing ({exc}); install google-auth and requests.",
        )
    except Exception as exc:
        print(f"[google] token verification failed: {exc}", flush=True)
        raise HTTPException(
            status_code=401,
            detail="Google sign-in could not be verified. Please try again (check the PC clock / client id).",
        )

    email = claims.get("email")
    if not email or not claims.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Google account e-mail is not verified")

    user = crud_user.get_user_by_email(db, email)
    if user is None:
        first = claims.get("given_name") or (claims.get("name", "").split(" ")[0] if claims.get("name") else "Google")
        last = claims.get("family_name") or "User"
        username = _unique_username(db, email.split("@")[0])
        user = models.User(
            username=username,
            email=email,
            first_name=first,
            last_name=last,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role_id=_customer_role_id(db),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    _ensure_patient_profile(db, user)

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")

    return user_schema.Token(access_token=create_access_token(subject=user.username))
