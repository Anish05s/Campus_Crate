from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    name: Optional[str] = None
    college: Optional[str] = None
    city: Optional[str] = None
    is_verified: bool
    trust_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID

from typing import List
from decimal import Decimal
from models import CategoryEnum, ConditionEnum, TypeEnum

class ListingBase(BaseModel):
    title: str
    description: str
    category: CategoryEnum
    condition: ConditionEnum
    type: TypeEnum
    price: Optional[Decimal] = None
    rent_per: Optional[str] = None
    deposit: Optional[Decimal] = None
    location: str
    images: List[str] = []

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[CategoryEnum] = None
    condition: Optional[ConditionEnum] = None
    type: Optional[TypeEnum] = None
    price: Optional[Decimal] = None
    rent_per: Optional[str] = None
    deposit: Optional[Decimal] = None
    location: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ListingResponse(ListingBase):
    id: UUID
    seller_id: UUID
    is_active: bool
    is_flagged: bool
    view_count: int
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    room_id: str
    text: str

class MessageResponse(BaseModel):
    id: UUID
    room_id: str
    sender_id: UUID
    text: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
