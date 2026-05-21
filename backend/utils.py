import os
import bcrypt
import jwt
from datetime import datetime, timedelta
import secrets
import resend

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_for_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""
    return str(secrets.randbelow(900000) + 100000)

def hash_otp(otp: str) -> str:
    """Hash the OTP using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(otp.encode('utf-8'), salt).decode('utf-8')

def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Verify plain OTP against hashed OTP."""
    return bcrypt.checkpw(plain_otp.encode('utf-8'), hashed_otp.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def send_otp_email(to_email: str, otp: str):
    """Send OTP via Resend API. Always prints to console as dev fallback."""
    # Always print to console for dev/debug visibility
    print(f"\n{'='*50}")
    print(f"📧 OTP for {to_email}: {otp}")
    print(f"{'='*50}\n")

    if not resend.api_key:
        return True
        
    try:
        resend.Emails.send({
            "from": f"CampusCrate <{FROM_EMAIL}>",
            "to": to_email,
            "subject": f"{otp} is your CampusCrate login code",
            "html": f"<p>Your CampusCrate verification code is: <strong>{otp}</strong></p><p>This code will expire in 10 minutes.</p>"
        })
        return True
    except Exception as e:
        print(f"⚠️  Email send failed (using console OTP above): {e}")
        return True  # Return True so login flow still proceeds
