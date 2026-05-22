import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Boolean, Float, DateTime, Integer, ForeignKey, Enum, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import enum

class CategoryEnum(str, enum.Enum):
    BOOKS = "Books"
    ELECTRONICS = "Electronics"
    LAB_TOOLS = "Lab Tools"
    HOSTEL = "Hostel Essentials"
    STATIONERY = "Stationery"
    SPORTS = "Sports"
    CLOTHING = "Clothing"
    OTHER = "Other"

class ConditionEnum(str, enum.Enum):
    NEW = "New"
    LIKE_NEW = "Like New"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"

class TypeEnum(str, enum.Enum):
    SELL = "sell"
    RENT = "rent"
    DONATE = "donate"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    name = Column(String, nullable=True)
    college = Column(String, nullable=True)
    city = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    trust_score = Column(Float, default=20.0) # Base score for email verified
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

class EmailOTP(Base):
    __tablename__ = "email_otps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, index=True, nullable=False)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    is_used = Column(Boolean, default=False)

def get_expire_time():
    return datetime.utcnow() + timedelta(days=60)

class Listing(Base):
    __tablename__ = "listings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(Enum(CategoryEnum), nullable=False)
    condition = Column(Enum(ConditionEnum), nullable=False)
    type = Column(Enum(TypeEnum), nullable=False)
    price = Column(Numeric(10, 2), nullable=True) # None if donating
    rent_per = Column(String, nullable=True) # day/week/month
    deposit = Column(Numeric(10, 2), nullable=True)
    location = Column(String, nullable=False)
    images = Column(JSON, default=list) # List of image URLs
    is_active = Column(Boolean, default=True)
    is_flagged = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=get_expire_time)

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(String, index=True, nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    text = Column(String(1000), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
