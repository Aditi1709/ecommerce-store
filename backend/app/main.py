from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

try:
    from seed_womens import reseed_womens
except Exception as _seed_err:
    reseed_womens = None

from app.core.database import engine
from seed_womens import reseed_womens
from app.models.product import Base
from app.models import (
    address,
    notification,
    return_request,
    review,
    support_ticket,
    wishlist,
)

from app.api.v1 import (
    addresses,
    auth,
    notifications,
    orders,
    products,
    returns,
    reviews,
    support,
    wishlists,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await reseed_womens(force=False)
    yield


app = FastAPI(
    title="Storefront E-Commerce API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)

app.include_router(addresses.router, prefix="/api/v1")
app.include_router(wishlists.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(returns.router, prefix="/api/v1")
app.include_router(support.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "Storefront API"}