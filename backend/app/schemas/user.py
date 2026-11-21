import uuid
from pydantic import BaseModel, ConfigDict


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    account_type: str = "user"  # "user" or "merchant"


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    email: str
    role: str


class AuthResponse(BaseModel):
    access_token: str
    user: UserOut