"""
Core game service — all timing, validation, and state logic lives here.
The backend is the single source of truth for:
 - correct answers
 - level unlock times
 - progress
 - final unlock
"""

from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
import secrets
import random

from app.config import settings
from app.models.player import Player
from app.models.level import Level
from app.models.hint import Hint, HintUsage
from app.models.attempt import Attempt
from app.models.progress import Progress
from app.models.gift import Gift, GiftUnlock


# ---------------------------------------------------------------------------
# Time helpers
# ---------------------------------------------------------------------------

def get_server_time_utc() -> datetime:
    """Always returns real UTC time — never trusts client."""
    return datetime.now(timezone.utc)


def parse_utc(iso_str: str) -> datetime:
    """Parse an ISO UTC string into an aware datetime."""
    s = iso_str.replace("Z", "+00:00")
    return datetime.fromisoformat(s)


def get_game_start_utc() -> datetime:
    if settings.GAME_TEST_MODE and settings.TEST_GAME_START_TIME:
        return parse_utc(settings.TEST_GAME_START_TIME)
    return parse_utc(settings.REAL_GAME_START_TIME_UTC)


def test_mode_all_levels_unlocked() -> bool:
    """Returns True only in test mode — bypasses time-based level locking."""
    return bool(settings.GAME_TEST_MODE)


def get_birthday_utc() -> datetime:
    if settings.GAME_TEST_MODE and settings.TEST_GAME_START_TIME:
        # In test mode birthday = game_start + 3 hours (6 levels × 30 min = 3 hours)
        gs = parse_utc(settings.TEST_GAME_START_TIME)
        from datetime import timedelta
        return gs + timedelta(hours=3)
    return parse_utc(settings.REAL_BIRTHDAY_TIME_UTC)


def fmt_utc(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def to_ist_label(dt: datetime) -> str:
    from datetime import timedelta
    ist = dt + timedelta(hours=5, minutes=30)
    return ist.strftime("%d %b %Y %I:%M %p IST")


# ---------------------------------------------------------------------------
# Wrong-answer feedback pool (Pooja / Didi themed)
# ---------------------------------------------------------------------------
WRONG_FEEDBACK = [
    "❌ Galat jawab, Didi. 😂 Phir se try karo.",
    "Nahi nahi nahi. Sudha ko tumse ye expect nahi tha. 🙄",
    "Dimag thoda aur lagao, Didi. 😂",
    "Wrong. Lekin ek aur chance deti hoon. 😂",
    "Hmm. Ye ek choice thi. Sahi choice nahi thi though. 😂",
    "Close. (Bilkul nahi.) 😂 Thoda aur socho.",
    "Error 404: Sahi jawab tumhare selection mein nahi mila. 😂",
    "Didi, clue toh right there tha. Wahi. 🫣",
    "Main disappointed nahi hoon, bas... okay thodi hoon. Phir try karo.",
    "Ye jawab itna galat tha ki wapas galat ho gaya. 😂",
    "Tumhari chhoti behen ko ye sahi pata tha. Socho. 😂",
    "Sahi jawab right there tha, Didi. Dhyan se. 💄",
]

CORRECT_FEEDBACK = [
    "✅ SAHI! Dekho, tumhare dimag mein sab kuch hai. 😂",
    "✅ Haan! Yahi toh tha. Shabash, Didi. ❤️",
    "✅ Dekho tumhe yaad hai! Main almost impressed hoon.",
    "✅ Sahi! Mujhe laga tha 50 hints dene padenge. 😂",
]


def random_wrong_feedback() -> str:
    return random.choice(WRONG_FEEDBACK)


def random_correct_feedback() -> str:
    return random.choice(CORRECT_FEEDBACK)


# ---------------------------------------------------------------------------
# Level timing helpers — 6 levels, each 30 minutes apart
# ---------------------------------------------------------------------------

def get_level_unlock_utc(level_number: int, game_start: datetime) -> datetime:
    """Level N unlocks at game_start + (N-1) * 30 minutes."""
    from datetime import timedelta
    return game_start + timedelta(minutes=30 * (level_number - 1))


def get_level_deadline_utc(level_number: int, game_start: datetime) -> datetime:
    """Level N deadline = game_start + N * 30 minutes.

    In test mode, if the computed deadline is already in the past (because
    TEST_GAME_START_TIME is a past timestamp), return now + 30 minutes instead.
    This prevents LevelCard from seeing deadline_utc in the past and immediately
    firing the 'timed out' state before the player can even read the question.
    """
    from datetime import timedelta
    deadline = game_start + timedelta(minutes=30 * level_number)
    if settings.GAME_TEST_MODE:
        now = get_server_time_utc()
        if deadline <= now:
            return now + timedelta(minutes=30)
    return deadline


# ---------------------------------------------------------------------------
# Player management
# ---------------------------------------------------------------------------

async def get_or_create_player(db: AsyncSession, session_id: str) -> Optional[Player]:
    result = await db.execute(
        select(Player).where(Player.session_id == session_id)
    )
    return result.scalar_one_or_none()


async def create_player(db: AsyncSession, name: str = "Pooja") -> Player:
    session_id = secrets.token_hex(32)
    player = Player(name=name, session_id=session_id)
    db.add(player)
    await db.flush()

    # Create initial progress
    prog = Progress(
        player_id=player.id,
        current_level=1,
        completed_levels=[],
        game_started=True,
        final_unlocked=False,
        level5_main_done=False,
    )
    db.add(prog)
    await db.commit()
    await db.refresh(player)
    return player


async def get_progress(db: AsyncSession, player_id: int) -> Optional[Progress]:
    result = await db.execute(
        select(Progress).where(Progress.player_id == player_id)
    )
    return result.scalar_one_or_none()


async def touch_player(db: AsyncSession, player: Player):
    player.last_seen = get_server_time_utc()
    await db.commit()


# ---------------------------------------------------------------------------
# Level status computation — now supports 6 levels
# ---------------------------------------------------------------------------

def compute_level_status(
    level_number: int,
    completed_levels: List[int],
    now_utc: datetime,
    game_start: datetime,
    birthday_utc: datetime,
) -> dict:
    unlock_utc = get_level_unlock_utc(level_number, game_start)
    deadline_utc = get_level_deadline_utc(level_number, game_start)

    if level_number in completed_levels:
        status = "completed"
    elif now_utc >= unlock_utc or test_mode_all_levels_unlocked():
        status = "available"
    else:
        status = "locked"

    remaining = max(0, int((deadline_utc - now_utc).total_seconds()))

    return {
        "level_number": level_number,
        "status": status,
        "unlock_time_utc": fmt_utc(unlock_utc),
        "deadline_utc": fmt_utc(deadline_utc),
        "time_remaining_seconds": remaining if status == "available" else None,
    }


# ---------------------------------------------------------------------------
# Attempt recording and validation
# ---------------------------------------------------------------------------

async def count_attempts(
    db: AsyncSession, player_id: int, level_id: int, question_type: str = "main"
) -> int:
    result = await db.execute(
        select(func.count(Attempt.id)).where(
            and_(
                Attempt.player_id == player_id,
                Attempt.level_id == level_id,
                Attempt.question_type == question_type,
            )
        )
    )
    return result.scalar() or 0


async def record_attempt(
    db: AsyncSession,
    player_id: int,
    level_id: int,
    selected_answer: str,
    is_correct: bool,
    attempt_number: int,
    question_type: str = "main",
):
    attempt = Attempt(
        player_id=player_id,
        level_id=level_id,
        selected_answer=selected_answer[:50].upper(),  # cap at 50 chars
        is_correct=is_correct,
        attempt_number=attempt_number,
        question_type=question_type,
    )
    db.add(attempt)
    await db.commit()
    return attempt


# ---------------------------------------------------------------------------
# Hints
# ---------------------------------------------------------------------------

async def get_hints_for_level(db: AsyncSession, level_id: int) -> List[Hint]:
    result = await db.execute(
        select(Hint)
        .where(Hint.level_id == level_id)
        .order_by(Hint.hint_number)
    )
    return list(result.scalars().all())


async def count_hints_used(db: AsyncSession, player_id: int, level_id: int) -> int:
    result = await db.execute(
        select(func.count(HintUsage.id)).where(
            and_(
                HintUsage.player_id == player_id,
                HintUsage.level_id == level_id,
            )
        )
    )
    return result.scalar() or 0


async def use_hint(
    db: AsyncSession, player_id: int, level_id: int, hint_id: int
):
    usage = HintUsage(player_id=player_id, level_id=level_id, hint_id=hint_id)
    db.add(usage)
    await db.commit()


# ---------------------------------------------------------------------------
# Gift unlock
# ---------------------------------------------------------------------------

async def get_gift_for_level(db: AsyncSession, level_id: int) -> Optional[Gift]:
    result = await db.execute(
        select(Gift).where(Gift.level_id == level_id)
    )
    return result.scalar_one_or_none()


async def unlock_gift(db: AsyncSession, player_id: int, gift: Gift):
    # Check not already unlocked
    result = await db.execute(
        select(GiftUnlock).where(
            and_(
                GiftUnlock.player_id == player_id,
                GiftUnlock.gift_id == gift.id,
            )
        )
    )
    existing = result.scalar_one_or_none()
    if not existing:
        gu = GiftUnlock(player_id=player_id, gift_id=gift.id)
        db.add(gu)
        await db.commit()


async def get_unlocked_gift_ids(db: AsyncSession, player_id: int) -> List[int]:
    result = await db.execute(
        select(GiftUnlock.gift_id).where(GiftUnlock.player_id == player_id)
    )
    return [r[0] for r in result.fetchall()]


# ---------------------------------------------------------------------------
# Mark level complete — updated for 6 levels
# ---------------------------------------------------------------------------

async def mark_level_complete(
    db: AsyncSession, progress: Progress, level_number: int
):
    completed = list(progress.completed_levels or [])
    if level_number not in completed:
        completed.append(level_number)
    progress.completed_levels = completed

    if level_number < 6:
        progress.current_level = level_number + 1
    else:
        progress.current_level = 6  # stay at 6 until birthday

    await db.commit()


async def check_and_unlock_birthday(
    db: AsyncSession, progress: Progress, now_utc: datetime, birthday_utc: datetime
) -> bool:
    if progress.final_unlocked:
        return True
    # Birthday unlocks when all 6 levels are done AND it's past the birthday time
    all_done = set(range(1, 7)).issubset(set(progress.completed_levels or []))
    if all_done and now_utc >= birthday_utc:
        progress.final_unlocked = True
        await db.commit()
        return True
    return False
