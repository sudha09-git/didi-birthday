from pydantic_settings import BaseSettings
from typing import Optional
from datetime import datetime
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/pooja_birthday"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/pooja_birthday"

    ADMIN_USERNAME: str = "sudha"
    ADMIN_PASSWORD: str = "sudhagomacontrolroom"
    ADMIN_SECRET_KEY: str = "sudha-admin-secret-key-change-in-production"

    APP_ENV: str = "development"
    SECRET_KEY: str = "secret-key-change-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Game test mode
    GAME_TEST_MODE: bool = False
    TEST_GAME_START_TIME: Optional[str] = None  # ISO format UTC string

    # Real game start: 5 Oct 2026 9:00 PM IST = 15:30 UTC
    REAL_GAME_START_TIME_UTC: str = "2026-10-05T15:30:00Z"
    # Real birthday: 6 Oct 2026 12:00 AM IST = 18:30 UTC on 5 Oct
    REAL_BIRTHDAY_TIME_UTC: str = "2026-10-05T18:30:00Z"

    @property
    def allowed_origins_list(self) -> list:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
