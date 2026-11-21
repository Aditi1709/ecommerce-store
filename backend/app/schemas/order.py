import uuid
from pydantic import BaseModel, ConfigDict, Field


class OrderItemIn(BaseModel):
    variant_id: uuid.UUID
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    shipping_address: dict
    payment_method: str = "cod"  # "upi" | "cod"
    payment_ref: str | None = None
    items: list[OrderItemIn] = Field(min_length=1)


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: str
    payment_method: str
    total_minor: int