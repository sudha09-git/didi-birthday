from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ---- Player ----
class PlayerCreate(BaseModel):
    name: str = "Pooja"


class PlayerOut(BaseModel):
    id: int
    name: str
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Game Start ----
class GameStartResponse(BaseModel):
    session_id: str
    player_id: int
    server_time_utc: str
    game_starts_utc: str
    message: str


# ---- Server Time ----
class ServerTimeResponse(BaseModel):
    server_time_utc: str
    server_time_ist: str
    game_started: bool
    birthday_unlocked: bool
    next_event_utc: Optional[str] = None
    next_event_label: Optional[str] = None


# ---- Level State (public - no answer) ----
class LevelOption(BaseModel):
    key: str
    text: str


class LevelStateResponse(BaseModel):
    level_number: int
    title: str
    question: str
    options: List[LevelOption]
    status: str  # locked | available | completed
    unlock_time_utc: str
    deadline_utc: str
    time_remaining_seconds: Optional[int] = None
    attempts: int
    hints_used: int
    # Level 5 sub-question
    sub_question: Optional[dict] = None
    level5_main_done: Optional[bool] = None


# ---- Game State ----
class GameStateResponse(BaseModel):
    session_id: str
    player_id: int
    current_level: int
    completed_levels: List[int]
    final_unlocked: bool
    game_started: bool
    server_time_utc: str
    levels_summary: List[dict]
    test_mode: bool = False


# ---- Attempt ----
class AttemptRequest(BaseModel):
    session_id: str
    level_number: int
    selected_answer: str  # free-text answer, normalized server-side
    question_type: str = "main"


class AttemptResponse(BaseModel):
    is_correct: bool
    feedback: str
    attempts_so_far: int
    level_cleared: bool
    gift_unlocked: Optional[dict] = None
    next_level_unlock_utc: Optional[str] = None


# ---- Hint ----
class HintRequest(BaseModel):
    session_id: str
    level_number: int
    hint_number: int


class HintResponse(BaseModel):
    hint_number: int
    hint_text: str
    total_hints: int


# ---- Gift ----
class GiftOut(BaseModel):
    id: int
    level_id: int
    title: str
    description: str
    gift_type: str
    content: Optional[str] = None
    unlocked: bool

    class Config:
        from_attributes = True


# ---- Photo ----
class PhotoOut(BaseModel):
    id: int
    filename: str
    order: int
    category: str
    caption: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Admin ----
class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    message: str


class AdminStatsResponse(BaseModel):
    total_players: int
    server_time_utc: str
    server_time_ist: str
    players: List[dict]


class AdminLevelUpdate(BaseModel):
    title: Optional[str] = None
    question: Optional[str] = None
    options: Optional[List[dict]] = None
    correct_answer: Optional[str] = None
    unlock_time_utc: Optional[str] = None
    deadline_utc: Optional[str] = None
    sub_question: Optional[dict] = None
