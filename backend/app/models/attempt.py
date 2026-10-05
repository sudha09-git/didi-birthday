from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.database import Base


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False, index=True)
    selected_answer = Column(String(10), nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    attempt_number = Column(Integer, nullable=False, default=1)
    # For Level 5 two-question flow: "main" or "sub"
    question_type = Column(String(10), default="main")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
