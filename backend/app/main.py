from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_tables
from app.routes import game, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    await create_tables()
    yield


app = FastAPI(
    title="Pooja Birthday Treasure Hunt API",
    description="Backend for Pooja's 26th birthday sister treasure hunt by Sudha.",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok", "message": "Pooja ka birthday treasure hunt chal raha hai ❤️"}
