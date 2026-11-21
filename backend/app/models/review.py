from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from app.models.product import Base


class ProductReview(Base):
    __tablename__ = "product_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_name = Column(String(120), nullable=False)
    product_slug = Column(String(200), nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    rating = Column(Integer, nullable=False)  # 1..5
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)