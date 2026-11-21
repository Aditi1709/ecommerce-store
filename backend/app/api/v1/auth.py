from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserOut, AuthResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    any_user = (await db.execute(select(User).limit(1))).scalar_one_or_none()
    if not any_user:
        role = "owner"
    elif payload.account_type == "merchant":
        role = "merchant"
    else:
        role = "user"

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.role)
    return AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id), user.role)
    return AuthResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user