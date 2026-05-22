from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, EmailOTP
from schemas import OTPRequest, OTPVerify, TokenResponse, RegisterRequest, LoginRequest
from utils import generate_otp, hash_otp, verify_otp_hash, create_access_token, create_refresh_token, send_otp_email, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_200_OK)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        if user.is_verified:
            raise HTTPException(status_code=400, detail="User with this email already exists and is verified. Please log in.")
        else:
            # Update password for unverified user trying to register again
            user.hashed_password = get_password_hash(request.password)
            db.commit()
    else:
        user = User(
            email=email,
            hashed_password=get_password_hash(request.password),
            is_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 1. Generate OTP
    otp = generate_otp()
    hashed = hash_otp(otp)
    
    # 2. Store OTP in DB
    expires = datetime.utcnow() + timedelta(minutes=10)
    db_otp = EmailOTP(
        email=email,
        otp_hash=hashed,
        expires_at=expires
    )
    db.add(db_otp)
    db.commit()
    
    # 3. Send email
    send_otp_email(email, otp)
    
    return {"message": "OTP has been sent to verify your registration."}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email = request.email.lower()
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email is not verified. Please register again to receive an OTP.")
        
    if not user.hashed_password or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    user.last_active = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token", 
        value=refresh_token, 
        httponly=True, 
        max_age=30 * 24 * 60 * 60, # 30 days
        samesite="lax"
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(request: OTPVerify, response: Response, db: Session = Depends(get_db)):
    email = request.email.lower()
    
    # Find latest active OTP for email
    db_otp = db.query(EmailOTP).filter(
        EmailOTP.email == email,
        EmailOTP.is_used == False,
        EmailOTP.expires_at > datetime.utcnow()
    ).order_by(EmailOTP.expires_at.desc()).first()
    
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    if db_otp.attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many attempts. Request a new OTP.")
        
    # Verify hash
    if not verify_otp_hash(request.otp, db_otp.otp_hash):
        db_otp.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # OTP is valid
    db_otp.is_used = True
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found. Please register first.")
        
    user.is_verified = True
    user.last_active = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token", 
        value=refresh_token, 
        httponly=True, 
        max_age=30 * 24 * 60 * 60, # 30 days
        samesite="lax"
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}
