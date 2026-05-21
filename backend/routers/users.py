from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserProfile, UserUpdate
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserProfile)
def update_me(update_data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(current_user, key, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user
