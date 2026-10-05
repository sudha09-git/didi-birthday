from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class Hint(Base):
    __tablename__ = "hints"

    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False, index=True)
    hint_number = Column(Integer, nullable=False)
    hint_text = Column(String(1000), nullable=False)
    cost = Column(Integer, default=0)


class HintUsage(Base):
    __tablename__ = "hint_usage"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False)
    hint_id = Column(Integer, ForeignKey("hints.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
