from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from database import get_db
from models import Message, User, Listing
from schemas import MessageResponse, MessageCreate
from dependencies import get_current_user
from chat_manager import manager
from utils import SECRET_KEY, ALGORITHM
import jwt
import json

router = APIRouter(prefix="/chat", tags=["chat"])

async def get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except jwt.InvalidTokenError:
        return None

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = Query(...), db: Session = Depends(get_db)):
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    # Check if user is part of this room (room_id format: listingId_buyerId_sellerId)
    if str(user.id) not in room_id:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            # Save message to DB
            new_msg = Message(room_id=room_id, sender_id=user.id, text=data)
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            
            # Broadcast to room
            msg_data = {
                "id": str(new_msg.id),
                "room_id": new_msg.room_id,
                "sender_id": str(new_msg.sender_id),
                "text": new_msg.text,
                "is_read": new_msg.is_read,
                "created_at": new_msg.created_at.isoformat()
            }
            await manager.broadcast(room_id, msg_data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)


@router.get("/rooms")
def get_user_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Find all messages where room_id contains the user's ID
    user_id_str = str(current_user.id)
    
    # We want the latest message for each distinct room
    messages = db.query(Message).filter(Message.room_id.like(f"%{user_id_str}%")).order_by(desc(Message.created_at)).all()
    
    # Group by room_id and get the latest message + metadata
    rooms = {}
    for msg in messages:
        if msg.room_id not in rooms:
            parts = msg.room_id.split('_')
            if len(parts) == 3:
                listing_id, buyer_id, seller_id = parts
                other_user_id = seller_id if buyer_id == user_id_str else buyer_id
                
                other_user = db.query(User).filter(User.id == other_user_id).first()
                listing = db.query(Listing).filter(Listing.id == listing_id).first()
                
                if other_user and listing:
                    rooms[msg.room_id] = {
                        "room_id": msg.room_id,
                        "listing": {"id": str(listing.id), "title": listing.title, "image": listing.images[0] if listing.images else None},
                        "other_user": {"id": str(other_user.id), "name": other_user.name or "User", "avatar": other_user.avatar_url},
                        "latest_message": msg.text,
                        "updated_at": msg.created_at.isoformat(),
                        "unread_count": 0 if msg.sender_id == current_user.id else (1 if not msg.is_read else 0) # simplified
                    }
    
    return list(rooms.values())

@router.get("/{room_id}/history", response_model=List[MessageResponse])
def get_chat_history(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.id) not in room_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
        
    messages = db.query(Message).filter(Message.room_id == room_id).order_by(Message.created_at.asc()).all()
    
    # Mark as read if sender is not current user
    for msg in messages:
        if msg.sender_id != current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()
    
    return messages
