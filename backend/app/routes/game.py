"""
Game routes — all public game endpoints.
Correct answers are NEVER returned to the client.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import re

from app.database import get_db
from app.schemas.game import (
    GameStartResponse, GameStateResponse, ServerTimeResponse,
    AttemptRequest, AttemptResponse,
    HintRequest, HintResponse,
    LevelStateResponse, LevelOption,
)
from app.services.game_service import (
    get_server_time_utc, fmt_utc, to_ist_label,
    get_game_start_utc, get_birthday_utc,
    get_level_unlock_utc, get_level_deadline_utc,
    compute_level_status, test_mode_all_levels_unlocked,
    create_player, get_or_create_player, get_progress, touch_player,
    count_attempts, record_attempt, mark_level_complete,
    get_hints_for_level, count_hints_used, use_hint,
    get_gift_for_level, unlock_gift, get_unlocked_gift_ids,
    check_and_unlock_birthday,
    random_wrong_feedback, random_correct_feedback,
)
from app.models.level import Level
from app.models.gift import Gift
from app.models.photo import Photo
from app.models.progress import Progress

router = APIRouter(prefix="/api/game", tags=["game"])

# Number of levels
TOTAL_LEVELS = 6


def normalize_answer(answer: str) -> str:
    """Normalize answer: uppercase, strip whitespace, collapse internal spaces."""
    return re.sub(r'\s+', ' ', answer.strip().upper())


# ---------------------------------------------------------------------------
# Helper: resolve player from session header
# ---------------------------------------------------------------------------
async def _resolve_player(session_id: str, db: AsyncSession):
    player = await get_or_create_player(db, session_id)
    if not player:
        raise HTTPException(status_code=401, detail="Invalid session. Please start the game again.")
    await touch_player(db, player)
    return player


# ---------------------------------------------------------------------------
# POST /api/game/start
# ---------------------------------------------------------------------------
@router.post("/start", response_model=GameStartResponse)
async def start_game(db: AsyncSession = Depends(get_db)):
    player = await create_player(db)
    now = get_server_time_utc()
    game_start = get_game_start_utc()
    return GameStartResponse(
        session_id=player.session_id,
        player_id=player.id,
        server_time_utc=fmt_utc(now),
        game_starts_utc=fmt_utc(game_start),
        message=f"Welcome, Didi! ❤️ The treasure hunt starts at {to_ist_label(game_start)}.",
    )


# ---------------------------------------------------------------------------
# GET /api/game/server-time
# ---------------------------------------------------------------------------
@router.get("/server-time", response_model=ServerTimeResponse)
async def server_time(db: AsyncSession = Depends(get_db)):
    from app.config import settings
    now = get_server_time_utc()
    game_start = get_game_start_utc()
    birthday = get_birthday_utc()

    if settings.GAME_TEST_MODE:
        # In test mode the game is always considered started so the frontend
        # never shows a "starts at 9 PM" countdown.  birthday_unlocked is kept
        # False here — the DB flag (set only after all 6 levels are done) is the
        # authoritative source; we don't flip it from wall-clock in test mode.
        game_started = True
        birthday_unlocked = False
        next_event_utc = None
        next_event_label = None
    else:
        game_started = now >= game_start
        birthday_unlocked = now >= birthday
        next_event_utc = None
        next_event_label = None
        if not game_started:
            next_event_utc = fmt_utc(game_start)
            next_event_label = f"Treasure hunt starts at {to_ist_label(game_start)}"
        elif not birthday_unlocked:
            next_event_utc = fmt_utc(birthday)
            next_event_label = "Birthday reveal unlocks at midnight!"

    return ServerTimeResponse(
        server_time_utc=fmt_utc(now),
        server_time_ist=to_ist_label(now),
        game_started=game_started,
        birthday_unlocked=birthday_unlocked,
        next_event_utc=next_event_utc,
        next_event_label=next_event_label,
    )


# ---------------------------------------------------------------------------
# GET /api/game/state
# ---------------------------------------------------------------------------
@router.get("/state", response_model=GameStateResponse)
async def game_state(
    x_session_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    from app.config import settings
    if not x_session_id:
        raise HTTPException(status_code=401, detail="Session ID required")
    player = await _resolve_player(x_session_id, db)
    progress = await get_progress(db, player.id)

    now = get_server_time_utc()
    game_start = get_game_start_utc()
    birthday = get_birthday_utc()

    # Check birthday unlock
    if progress:
        await check_and_unlock_birthday(db, progress, now, birthday)

    completed = list(progress.completed_levels or []) if progress else []
    current = progress.current_level if progress else 1
    final_unlocked = progress.final_unlocked if progress else False

    levels_summary = []
    for ln in range(1, TOTAL_LEVELS + 1):
        s = compute_level_status(ln, completed, now, game_start, birthday)
        levels_summary.append(s)

    return GameStateResponse(
        session_id=x_session_id,
        player_id=player.id,
        current_level=current,
        completed_levels=completed,
        final_unlocked=final_unlocked,
        game_started=progress.game_started if progress else False,
        server_time_utc=fmt_utc(now),
        levels_summary=levels_summary,
        test_mode=bool(settings.GAME_TEST_MODE),
    )


# ---------------------------------------------------------------------------
# GET /api/game/current-level
# ---------------------------------------------------------------------------
@router.get("/current-level")
async def current_level(
    x_session_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not x_session_id:
        raise HTTPException(status_code=401, detail="Session ID required")
    player = await _resolve_player(x_session_id, db)
    progress = await get_progress(db, player.id)

    now = get_server_time_utc()
    game_start = get_game_start_utc()
    birthday = get_birthday_utc()

    # Find the highest available level that is not yet completed
    completed = list(progress.completed_levels or []) if progress else []

    for ln in range(1, TOTAL_LEVELS + 1):
        unlock_utc = get_level_unlock_utc(ln, game_start)
        if (now >= unlock_utc or test_mode_all_levels_unlocked()) and ln not in completed:
            # This is the current active level
            result = await db.execute(
                select(Level).where(Level.level_number == ln)
            )
            level = result.scalar_one_or_none()
            if not level:
                raise HTTPException(status_code=404, detail=f"Level {ln} data not found.")

            attempts = await count_attempts(db, player.id, level.id)
            hints_used = await count_hints_used(db, player.id, level.id)
            deadline_utc = get_level_deadline_utc(ln, game_start)
            remaining = max(0, int((deadline_utc - now).total_seconds()))

            resp = {
                "level_number": level.level_number,
                "title": level.title,
                "question": level.question,
                "options": level.options,  # story/clue text, not MCQ keys
                "status": "available",
                "unlock_time_utc": fmt_utc(unlock_utc),
                "deadline_utc": fmt_utc(deadline_utc),
                "time_remaining_seconds": remaining,
                "attempts": attempts,
                "hints_used": hints_used,
            }

            return resp

    # All levels complete — waiting for birthday or birthday unlocked
    if set(range(1, TOTAL_LEVELS + 1)).issubset(set(completed)):
        return {"status": "all_complete", "final_unlocked": progress.final_unlocked if progress else False}

    # Game not started
    return {"status": "waiting", "game_starts_utc": fmt_utc(game_start)}


# ---------------------------------------------------------------------------
# POST /api/game/attempt
# ---------------------------------------------------------------------------
@router.post("/attempt", response_model=AttemptResponse)
async def submit_attempt(
    body: AttemptRequest,
    db: AsyncSession = Depends(get_db),
):
    player = await _resolve_player(body.session_id, db)
    progress = await get_progress(db, player.id)

    now = get_server_time_utc()
    game_start = get_game_start_utc()
    birthday = get_birthday_utc()

    ln = body.level_number

    # Validate game started (skipped in test mode — all levels immediately available)
    if not test_mode_all_levels_unlocked() and now < game_start:
        raise HTTPException(status_code=403, detail="Treasure hunt nahi shuru hua abhi, Didi! Patience. ❤️")

    # Validate level unlock time (skipped in test mode)
    unlock_utc = get_level_unlock_utc(ln, game_start)
    if not test_mode_all_levels_unlocked() and now < unlock_utc:
        raise HTTPException(
            status_code=403,
            detail=f"Level {ln} {to_ist_label(unlock_utc)} tak locked hai. No cheating, Didi. 😂"
        )

    # Validate level not already completed
    completed = list(progress.completed_levels or []) if progress else []
    if body.question_type == "main" and ln in completed:
        raise HTTPException(status_code=400, detail=f"Level {ln} already completed!")

    # Fetch level from DB
    result = await db.execute(select(Level).where(Level.level_number == ln))
    level = result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail=f"Level {ln} not found")

    # Determine correct answer — normalize both sides
    correct_raw = level.correct_answer
    # Support multiple valid answers separated by "|"
    correct_options = [normalize_answer(c) for c in correct_raw.split("|")]

    submitted = normalize_answer(body.selected_answer)
    is_correct = submitted in correct_options

    # Count attempts so far
    attempt_count = await count_attempts(db, player.id, level.id, body.question_type)
    attempt_count += 1

    # Record attempt
    await record_attempt(db, player.id, level.id, submitted, is_correct, attempt_count, body.question_type)

    total_attempts = await count_attempts(db, player.id, level.id, body.question_type)

    if not is_correct:
        return AttemptResponse(
            is_correct=False,
            feedback=random_wrong_feedback(),
            attempts_so_far=total_attempts,
            level_cleared=False,
        )

    # Correct answer handling
    feedback = random_correct_feedback()
    gift_data = None
    next_unlock_utc = None
    level_cleared = True

    # Mark level complete
    if progress:
        await mark_level_complete(db, progress, ln)

    # Unlock gift
    gift = await get_gift_for_level(db, level.id)
    if gift:
        await unlock_gift(db, player.id, gift)
        gift_data = {
            "id": gift.id,
            "title": gift.title,
            "description": gift.description,
            "gift_type": gift.gift_type,
            "content": gift.content,
        }

    # Next level unlock time (for levels 1–5; level 6 shows birthday countdown)
    if ln < TOTAL_LEVELS:
        next_unlock = get_level_unlock_utc(ln + 1, game_start)
        next_unlock_utc = fmt_utc(next_unlock)

    # Check birthday
    await check_and_unlock_birthday(db, progress, now, birthday)

    return AttemptResponse(
        is_correct=True,
        feedback=feedback,
        attempts_so_far=total_attempts,
        level_cleared=level_cleared,
        gift_unlocked=gift_data,
        next_level_unlock_utc=next_unlock_utc,
    )


# ---------------------------------------------------------------------------
# POST /api/game/hint
# ---------------------------------------------------------------------------
@router.post("/hint", response_model=HintResponse)
async def request_hint(
    body: HintRequest,
    db: AsyncSession = Depends(get_db),
):
    player = await _resolve_player(body.session_id, db)

    result = await db.execute(select(Level).where(Level.level_number == body.level_number))
    level = result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    hints = await get_hints_for_level(db, level.id)
    if not hints:
        raise HTTPException(status_code=404, detail="No hints available for this level")

    # Find the requested hint
    hint = next((h for h in hints if h.hint_number == body.hint_number), None)
    if not hint:
        raise HTTPException(status_code=404, detail=f"Hint {body.hint_number} not available")

    # Record usage if not already used
    await use_hint(db, player.id, level.id, hint.id)

    return HintResponse(
        hint_number=hint.hint_number,
        hint_text=hint.hint_text,
        total_hints=len(hints),
    )


# ---------------------------------------------------------------------------
# GET /api/game/gifts
# ---------------------------------------------------------------------------
@router.get("/gifts")
async def get_gifts(
    x_session_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not x_session_id:
        raise HTTPException(status_code=401, detail="Session ID required")
    player = await _resolve_player(x_session_id, db)
    unlocked_ids = await get_unlocked_gift_ids(db, player.id)

    result = await db.execute(select(Gift).order_by(Gift.level_id))
    all_gifts = result.scalars().all()

    gifts_out = []
    for g in all_gifts:
        is_unlocked = g.id in unlocked_ids
        gifts_out.append({
            "id": g.id,
            "level_id": g.level_id,
            "title": g.title,
            "description": g.description if is_unlocked else "🔒 Complete the level to unlock this memory.",
            "gift_type": g.gift_type,
            "content": g.content if is_unlocked else None,
            "unlocked": is_unlocked,
        })

    return {"gifts": gifts_out}


# ---------------------------------------------------------------------------
# GET /api/game/photos
# ---------------------------------------------------------------------------
@router.get("/photos")
async def get_photos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).order_by(Photo.order))
    photos = result.scalars().all()
    return {
        "photos": [
            {
                "id": p.id,
                "filename": p.filename,
                "order": p.order,
                "category": p.category,
                "caption": p.caption,
            }
            for p in photos
        ]
    }
