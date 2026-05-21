from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, EmailOTP
from schemas import OTPRequest, OTPVerify, TokenResponse
from utils import generate_otp, hash_otp, verify_otp_hash, create_access_token, create_refresh_token, send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/request-otp", status_code=status.HTTP_200_OK)
def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    
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
    
    return {"message": "If this email is allowed, an OTP has been sent."}

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
    
    # Check if user exists, else create
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, is_verified=True)
        db.add(user)
    
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
