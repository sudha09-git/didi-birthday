from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(200), nullable=False)
    order = Column(Integer, default=0)
    category = Column(String(100), default="general")
    caption = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
