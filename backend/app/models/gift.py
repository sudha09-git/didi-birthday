from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.database import Base


class Gift(Base):
    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=False)
    gift_type = Column(String(50), default="text")  # text, certificate, cards, final
    # JSON payload for rich gift content
    content = Column(String(5000), nullable=True)
    image = Column(String(500), nullable=True)
    unlocked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GiftUnlock(Base):
    __tablename__ = "gift_unlocks"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    gift_id = Column(Integer, ForeignKey("gifts.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
