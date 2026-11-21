from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.review import ProductReview

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewIn(BaseModel):
    product_slug: str
    product_name: str
    rating: int = Field(..., ge=1, le=5)
    comment: str


@router.get("/product/{slug}")
def list_product_reviews(slug: str, db: Session = Depends(get_db)):
    return (
        db.query(ProductReview)
        .filter(ProductReview.product_slug == slug)
        .order_by(ProductReview.created_at.desc())
        .all()
    )


@router.get("/me")
def list_my_reviews(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(ProductReview)
        .filter(ProductReview.user_id == str(user.id))
        .order_by(ProductReview.created_at.desc())
        .all()
    )


@router.post("/")
def create_review(payload: ReviewIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    rev = ProductReview(
        user_id=str(user.id),
        user_name=getattr(user, "name", "Customer"),
        **payload.model_dump(),
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev


@router.delete("/{review_id}")
def delete_review(review_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    rev = (
        db.query(ProductReview)
        .filter(ProductReview.id == review_id, ProductReview.user_id == str(user.id))
        .first()
    )
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(rev)
    db.commit()
    return {"ok": True}