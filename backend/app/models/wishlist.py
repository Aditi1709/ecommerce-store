from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from app.models.product import Base  # adjust if your Base is in app.database


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    list_name = Column(String(80), default="Favorites", nullable=False)
    variant_id = Column(String(120), nullable=False)
    product_name = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    sku = Column(String(80), nullable=False)
    label = Column(String(120), default="")
    price_minor = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    price_drop_alert = Column(Boolean, default=True)
    back_in_stock_alert = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)