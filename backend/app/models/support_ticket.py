from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from app.models.product import Base  # adjust if your Base is in app.database


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    order_id = Column(String(80), nullable=True)
    category = Column(String(60), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="Open")  # Open | In Progress | Escalated | Resolved
    escalation_level = Column(Integer, default=1)  # 1, 2, 3
    assigned_to = Column(String(100), default="Level 1 Support Desk")
    created_at = Column(DateTime, default=datetime.utcnow)