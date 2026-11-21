from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from app.models.product import Base  # adjust import if your Base is in app.database


class Address(Base):
    __tablename__ = "addresses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(50), default="Home", nullable=False)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(20), nullable=False)
    line1 = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)