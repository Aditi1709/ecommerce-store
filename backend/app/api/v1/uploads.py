import os
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.core.security import require_merchant
from app.models.user import User

router = APIRouter(prefix="/api/v1/uploads", tags=["Uploads"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_merchant),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = os.path.splitext(file.filename or "img.png")[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"http://127.0.0.1:8000/uploads/{filename}"}