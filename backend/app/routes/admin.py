"""
Admin routes — protected by JWT. Never expose to public.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from app.database import get_db
from app.schemas.game import (
    AdminLoginRequest, AdminLoginResponse, AdminLevelUpdate
)
from app.utils.auth import verify_admin_credentials, create_admin_token, verify_admin_token
from app.services.game_service import (
    get_server_time_utc, fmt_utc, to_ist_label,
    get_game_start_utc, get_birthday_utc,
    count_attempts, count_hints_used,
)
from app.models.player import Player
from app.models.level import Level
from app.models.hint import Hint
from app.models.attempt import Attempt
from app.models.progress import Progress
from app.models.gift import Gift

router = APIRouter(prefix="/api/admin", tags=["admin"])
security = HTTPBearer()


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    subject = verify_admin_token(credentials.credentials)
    if subject != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return subject


# ---------------------------------------------------------------------------
# POST /api/admin/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(body: AdminLoginRequest):
    if not verify_admin_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_admin_token()
    return AdminLoginResponse(token=token, message="Welcome, admin.")


# ---------------------------------------------------------------------------
# GET /api/admin/stats
# ---------------------------------------------------------------------------
@router.get("/stats")
async def admin_stats(
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    now = get_server_time_utc()
    game_start = get_game_start_utc()
    birthday = get_birthday_utc()

    # Fetch all players
    result = await db.execute(select(Player).order_by(Player.created_at))
    players = result.scalars().all()

    # Fetch all levels
    lvl_result = await db.execute(select(Level).order_by(Level.level_number))
    levels = lvl_result.scalars().all()

    players_data = []
    for p in players:
        prog_result = await db.execute(
            select(Progress).where(Progress.player_id == p.id)
        )
        prog = prog_result.scalar_one_or_none()

        level_stats = []
        for lvl in levels:
            total_attempts = await count_attempts(db, p.id, lvl.id)
            hints_used = await count_hints_used(db, p.id, lvl.id)
            completed = lvl.level_number in (prog.completed_levels or []) if prog else False

            # Find solve time (last correct attempt)
            attempt_result = await db.execute(
                select(Attempt)
                .where(
                    Attempt.player_id == p.id,
                    Attempt.level_id == lvl.id,
                    Attempt.is_correct == True,
                )
                .order_by(Attempt.created_at.desc())
                .limit(1)
            )
            last_correct = attempt_result.scalar_one_or_none()

            # Check if level was timed out (no correct attempt + deadline passed)
            game_start = get_game_start_utc()
            from app.services.game_service import get_level_deadline_utc
            deadline_utc = get_level_deadline_utc(lvl.level_number, game_start)
            timed_out = not completed and now > deadline_utc

            level_stats.append({
                "level_number": lvl.level_number,
                "title": lvl.title,
                "status": "completed" if completed else (
                    "timed_out" if timed_out else
                    "available" if now >= game_start else "locked"
                ),
                "total_attempts": total_attempts,
                "hints_used": hints_used,
                "solved_at": last_correct.created_at.isoformat() if last_correct else None,
                "timed_out": timed_out,
            })

        players_data.append({
            "id": p.id,
            "name": p.name,
            "session_id": p.session_id[:8] + "...",
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "last_seen": p.last_seen.isoformat() if p.last_seen else None,
            "current_level": prog.current_level if prog else 1,
            "completed_levels": prog.completed_levels if prog else [],
            "final_unlocked": prog.final_unlocked if prog else False,
            "game_started": prog.game_started if prog else False,
            "level_stats": level_stats,
        })

    return {
        "total_players": len(players),
        "server_time_utc": fmt_utc(now),
        "server_time_ist": to_ist_label(now),
        "game_starts_utc": fmt_utc(game_start),
        "birthday_utc": fmt_utc(birthday),
        "birthday_unlocked": now >= birthday,
        "players": players_data,
    }


# ---------------------------------------------------------------------------
# GET /api/admin/levels
# ---------------------------------------------------------------------------
@router.get("/levels")
async def admin_get_levels(
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Level).order_by(Level.level_number))
    levels = result.scalars().all()

    out = []
    for lvl in levels:
        hints_result = await db.execute(
            select(Hint).where(Hint.level_id == lvl.id).order_by(Hint.hint_number)
        )
        hints = hints_result.scalars().all()

        out.append({
            "id": lvl.id,
            "level_number": lvl.level_number,
            "title": lvl.title,
            "question": lvl.question,
            "options": lvl.options,
            "correct_answer": lvl.correct_answer,
            "unlock_time_utc": lvl.unlock_time_utc,
            "deadline_utc": lvl.deadline_utc,
            "sub_question": lvl.sub_question,
            "hints": [{"id": h.id, "hint_number": h.hint_number, "hint_text": h.hint_text} for h in hints],
        })

    return {"levels": out}


# ---------------------------------------------------------------------------
# PATCH /api/admin/levels/{level_id}
# ---------------------------------------------------------------------------
@router.patch("/levels/{level_id}")
async def admin_update_level(
    level_id: int,
    body: AdminLevelUpdate,
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Level).where(Level.id == level_id))
    level = result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    if body.title is not None:
        level.title = body.title
    if body.question is not None:
        level.question = body.question
    if body.options is not None:
        level.options = body.options
    if body.correct_answer is not None:
        level.correct_answer = body.correct_answer.upper()
    if body.unlock_time_utc is not None:
        level.unlock_time_utc = body.unlock_time_utc
    if body.deadline_utc is not None:
        level.deadline_utc = body.deadline_utc
    if body.sub_question is not None:
        level.sub_question = body.sub_question

    await db.commit()
    await db.refresh(level)
    return {"message": "Level updated", "level_number": level.level_number}


# ---------------------------------------------------------------------------
# POST /api/admin/levels (add new level)
# ---------------------------------------------------------------------------
@router.post("/levels")
async def admin_create_level(
    body: dict,
    admin=Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    lvl = Level(**body)
    db.add(lvl)
    await db.commit()
    await db.refresh(lvl)
    return {"message": "Level created", "id": lvl.id}
