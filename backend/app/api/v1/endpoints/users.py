import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_role_name, require_roles
from app.crud import crud_user
from app.models import models
from app.schemas import user_schema

router = APIRouter()


def _to_out(db: Session, user: models.User) -> user_schema.UserOut:
    out = user_schema.UserOut.model_validate(user)
    out.role_name = get_role_name(db, user.role_id)
    return out


@router.get("/", response_model=List[user_schema.UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles("Manager")),
):
    return [_to_out(db, u) for u in crud_user.get_users(db, skip=skip, limit=limit)]


@router.get("/{user_id}", response_model=user_schema.UserOut)
def read_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles("Manager")),
):
    user = crud_user.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(db, user)


@router.put("/{user_id}", response_model=user_schema.UserOut)
def update_user(
    user_id: uuid.UUID,
    data: user_schema.UserUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles("Manager")),
):
    user = crud_user.update_user(db, user_id, data)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(db, user)


@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles("Manager")),
):
    user = crud_user.delete_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@router.get("/me/profile", response_model=user_schema.UserOut)
def read_user_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _to_out(db, current_user)