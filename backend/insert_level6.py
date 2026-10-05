"""
insert_level6.py — Inserts Level 6 (missing from the database) with the new
question content, hints, and memory gift.

Does NOT touch any existing levels, hints, gifts, or player data.
Run from the backend folder:
    python insert_level6.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.config import settings
from app.models.level import Level
from app.models.hint import Hint
from app.models.gift import Gift

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

LEVEL6 = {
    "level_number": 6,
    "title": "Level 6",
    "question": "If I could give Didi only one thing on her birthday, what would be the best gift?",
    "options": [
        {"key": "A", "text": "Money"},
        {"key": "B", "text": "A fancy present"},
        {"key": "C", "text": "A huge birthday cake"},
        {"key": "D", "text": "A lifetime of memories together"},
    ],
    "correct_answer": "D",
    "unlock_time_utc": "2026-10-05T18:00:00Z",
    "deadline_utc": "2026-10-05T18:30:00Z",
    "sub_question": None,
}

LEVEL6_HINTS = [
    {"hint_number": 1, "hint_text": "Think about what lasts the longest."},
    {"hint_number": 2, "hint_text": "It cannot be bought from a shop."},
    {"hint_number": 3, "hint_text": "Memories together. Always."},
]

LEVEL6_GIFT = {
    "title": "A Lifetime of Memories",
    "description": "The best gift is not a thing. It is time together.",
    "gift_type": "memory",
    "content": (
        '{"message": "YOU GOT IT. The best gift was never a thing.\\n\\n'
        'It was every stupid argument.\\n'
        'Every late-night conversation.\\n'
        'Every moment we made each other laugh when nothing was funny.\\n\\n'
        'Happy Birthday, Didi. ❤️", '
        '"emoji": "❤️"}'
    ),
}


async def main():
    async with AsyncSession() as session:
        # Guard: skip if level 6 already exists
        existing = await session.execute(
            select(Level).where(Level.level_number == 6)
        )
        if existing.scalar_one_or_none():
            print("Level 6 already exists - nothing to do.")
            return

        # Insert level 6
        level = Level(**LEVEL6)
        session.add(level)
        await session.flush()
        print(f"[OK] Inserted Level 6 (id={level.id})")

        # Insert hints
        for h in LEVEL6_HINTS:
            hint = Hint(level_id=level.id, **h)
            session.add(hint)
        print(f"[OK] Inserted {len(LEVEL6_HINTS)} hints for Level 6")

        # Insert gift
        gift = Gift(level_id=level.id, **LEVEL6_GIFT)
        session.add(gift)
        print("[OK] Inserted memory gift for Level 6")

        await session.commit()
        print("\n[DONE] Level 6 inserted successfully.")
        print("All existing data is unchanged.")


if __name__ == "__main__":
    asyncio.run(main())
