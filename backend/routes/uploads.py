import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth import require_roles
from config import UPLOAD_DIR

router = APIRouter(prefix="/api/uploads", tags=["uploads"])
ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


@router.post("")
async def upload(file: UploadFile = File(...), _=Depends(require_roles("user", "shelter"))):
    ext = ALLOWED.get(file.content_type)
    if not ext:
        raise HTTPException(400, "Only JPG, PNG or WebP images are allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 5 MB")
    name = uuid.uuid4().hex + ext
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": "/uploads/" + name}
