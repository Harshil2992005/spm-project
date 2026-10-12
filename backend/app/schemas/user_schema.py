from datetime import datetime
from typing import Optional

import uuid
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: uuid.UUID
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OTPRequest(BaseModel):
    identifier: str


class OTPVerify(BaseModel):
    username: str
    otp: str


class OTPResponse(BaseModel):
    message: str
    email_sent: bool
    debug_otp: Optional[str] = None


class GoogleLogin(BaseModel):
    credential: str


class GoogleConfig(BaseModel):
    enabled: bool
    client_id: str


class TokenData(BaseModel):
    username: Optional[str] = None