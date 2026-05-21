from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader
import os
from dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Configure Cloudinary using the URL from environment
cloudinary.config(
    secure=True
)

@router.post("/")
async def upload_image(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        # Upload the file to Cloudinary
        # We use file.file which is the underlying SpooledTemporaryFile
        result = cloudinary.uploader.upload(
            file.file,
            folder="campus_crate",
            resource_type="image"
        )
        
        # Return the secure URL provided by Cloudinary
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
