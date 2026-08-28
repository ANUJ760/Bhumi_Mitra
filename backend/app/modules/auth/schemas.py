from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.modules.auth.models import RoleEnum
import re


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email address")
        return v.lower()


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AgencyResponse(BaseModel):
    id: UUID
    name: str
    type: str
    state: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: RoleEnum
    agency_id: Optional[UUID] = None
    state_scope: Optional[str] = None
    district_scope: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email address")
        return v.lower()


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: RoleEnum
    agency_id: Optional[UUID] = None
    state_scope: Optional[str] = None
    district_scope: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]
