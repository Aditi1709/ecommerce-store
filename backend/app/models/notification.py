from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from app.models.product import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event = Column(String(80), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(40), default="orders")  # account | orders | alerts | marketing
    channels = Column(String(100), default="email,push")  # comma-separated
    is_read = Column(Boolean, default=False)
    link = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)