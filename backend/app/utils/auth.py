from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12


def verify_admin_credentials(username: str, password: str) -> bool:
    return (
        username == settings.ADMIN_USERNAME
        and password == settings.ADMIN_PASSWORD
    )


def create_admin_token() -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    data = {"sub": "admin", "exp": expire}
    return jwt.encode(data, settings.ADMIN_SECRET_KEY, algorithm=ALGORITHM)


def verify_admin_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.ADMIN_SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
