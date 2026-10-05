from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, JSON, func
from app.database import Base


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), unique=True, nullable=False, index=True)
    current_level = Column(Integer, default=1)
    completed_levels = Column(JSON, default=list)   # [1, 2, 3, ...]
    # Level 5 specific: which sub-question passed
    level5_main_done = Column(Boolean, default=False)
    game_started = Column(Boolean, default=False)
    final_unlocked = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
