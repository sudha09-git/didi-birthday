from sqlalchemy import Column, Integer, String, DateTime, JSON, func
from app.database import Base


class Level(Base):
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    level_number = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    question = Column(String(2000), nullable=False)
    # Stored as JSON: [{"key": "A", "text": "..."}, ...]
    options = Column(JSON, nullable=False)
    correct_answer = Column(String(10), nullable=False)  # "A", "B", "C", "D"
    # UTC ISO timestamps
    unlock_time_utc = Column(String(50), nullable=False)
    deadline_utc = Column(String(50), nullable=False)
    # For Level 5 with 2 sub-questions
    sub_question = Column(JSON, nullable=True)  # {question, options, correct_answer}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
