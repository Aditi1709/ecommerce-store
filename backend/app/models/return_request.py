from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from app.models.product import Base  # adjust if your Base is in app.database


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(30), nullable=False)  # return | replacement | exchange | refund | cancel
    reason = Column(String(255), nullable=False)
    exchange_variant = Column(String(120), nullable=True)
    pickup_date = Column(String(30), nullable=True)
    pickup_slot = Column(String(60), nullable=True)
    refund_method = Column(String(40), nullable=True)  # original_payment | store_credit
    amount_minor = Column(Integer, default=0)
    stage_index = Column(Integer, default=0)  # 0..4
    refund_status = Column(String(40), default="Pending QC")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)