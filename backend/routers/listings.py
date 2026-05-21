from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from database import get_db
from models import Listing, User, CategoryEnum, ConditionEnum, TypeEnum
from schemas import ListingResponse, ListingCreate, ListingUpdate
from dependencies import get_current_user
import uuid

router = APIRouter(prefix="/listings", tags=["listings"])

@router.get("", response_model=List[ListingResponse])
def get_listings(
    db: Session = Depends(get_db),
    city: Optional[str] = None,
    category: Optional[CategoryEnum] = None,
    type: Optional[TypeEnum] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = db.query(Listing).filter(Listing.is_active == True)
    
    if city:
        query = query.filter(Listing.location.ilike(f"%{city}%"))
    if category:
        query = query.filter(Listing.category == category)
    if type:
        query = query.filter(Listing.type == type)
    if q:
        search = f"%{q}%"
        query = query.filter(or_(
            Listing.title.ilike(search),
            Listing.description.ilike(search)
        ))
        
    offset = (page - 1) * limit
    listings = query.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()
    return listings

@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_listing = Listing(**listing_in.model_dump(), seller_id=current_user.id)
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing

@router.get("/{id}", response_model=ListingResponse)
def get_listing(id: uuid.UUID, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    # Increment view count
    listing.view_count += 1
    db.commit()
    db.refresh(listing)
    return listing

@router.patch("/{id}", response_model=ListingResponse)
def update_listing(
    id: uuid.UUID,
    listing_in: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this listing")
        
    update_data = listing_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)
        
    db.commit()
    db.refresh(listing)
    return listing

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
        
    # Soft delete
    listing.is_active = False
    db.commit()
    return None
