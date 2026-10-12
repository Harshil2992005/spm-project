from typing import List, Optional

import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import models
from app.schemas import user_schema


def get_user(db: Session, user_id: uuid.UUID) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None and username:
        user = db.query(models.User).filter(func.lower(models.User.username) == username.lower()).first()
    return user


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(func.lower(models.User.email) == (email or "").strip().lower()).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, data: user_schema.UserCreate) -> models.User:
    user = models.User(
        username=data.username.strip(),
        email=str(data.email).strip().lower(),
        first_name=data.first_name,
        last_name=data.last_name,
        password_hash=hash_password(data.password),
        role_id=data.role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: uuid.UUID, data: user_schema.UserUpdate) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user is None:
        return None
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.password_hash = hash_password(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: uuid.UUID) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user