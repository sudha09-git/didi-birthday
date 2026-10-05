"""
update_questions.py — Updates ONLY the question text, MCQ options, and correct_answer
for all 6 levels in the birthday treasure-hunt game.

Does NOT touch: hints, gifts/rewards, timing, schema, player data, or any other field.
Run from the backend folder:
    python update_questions.py
"""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, update

from app.config import settings
from app.models.level import Level

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

# ---------------------------------------------------------------------------
# New question content only — all other level fields are left untouched
# ---------------------------------------------------------------------------
QUESTION_UPDATES = [
    {
        "level_number": 1,
        "question": "What is something sisters can do better than anyone else?",
        "options": [
            {"key": "A", "text": "Give completely unsolicited advice 😭"},
            {"key": "B", "text": "Win every argument"},
            {"key": "C", "text": "Embarrass each other in public"},
            {"key": "D", "text": "All of the above"},
        ],
        "correct_answer": "D",
    },
    {
        "level_number": 2,
        "question": "If Didi says, 'I'm not angry,' what does it usually mean?",
        "options": [
            {"key": "A", "text": "She is actually not angry"},
            {"key": "B", "text": "Everything is perfectly fine"},
            {"key": "C", "text": "You should probably be careful 😭"},
            {"key": "D", "text": "She wants ice cream"},
        ],
        "correct_answer": "C",
    },
    {
        "level_number": 3,
        "question": "Who can make a bad day feel a little better without doing anything special?",
        "options": [
            {"key": "A", "text": "A motivational speaker"},
            {"key": "B", "text": "Didi"},
            {"key": "C", "text": "The internet"},
            {"key": "D", "text": "Chocolate"},
        ],
        "correct_answer": "B",
    },
    {
        "level_number": 4,
        "question": "Which of these is an unofficial rule of being sisters?",
        "options": [
            {"key": "A", "text": "You can tease each other endlessly"},
            {"key": "B", "text": "You can fight over the smallest things"},
            {"key": "C", "text": "You still protect each other when it matters"},
            {"key": "D", "text": "All of the above"},
        ],
        "correct_answer": "D",
    },
    {
        "level_number": 5,
        "question": "Years from now, when life gets busy and we're far apart, what should never change?",
        "options": [
            {"key": "A", "text": "Our arguments"},
            {"key": "B", "text": "Our inside jokes"},
            {"key": "C", "text": "Our habit of annoying each other"},
            {"key": "D", "text": "The bond between us"},
        ],
        "correct_answer": "D",
    },
    {
        "level_number": 6,
        "question": "If I could give Didi only one thing on her birthday, what would be the best gift?",
        "options": [
            {"key": "A", "text": "Money"},
            {"key": "B", "text": "A fancy present"},
            {"key": "C", "text": "A huge birthday cake"},
            {"key": "D", "text": "A lifetime of memories together"},
        ],
        "correct_answer": "D",
    },
]


async def main():
    async with AsyncSession() as session:
        for upd in QUESTION_UPDATES:
            ln = upd["level_number"]
            result = await session.execute(
                select(Level).where(Level.level_number == ln)
            )
            level = result.scalar_one_or_none()
            if not level:
                print(f"  [WARN] Level {ln} not found - skipping.")
                continue

            level.question = upd["question"]
            level.options = upd["options"]
            level.correct_answer = upd["correct_answer"]
            print(f"  [OK] Level {ln} updated - correct_answer={upd['correct_answer']!r}")

        await session.commit()
        print("\n[DONE] All question updates committed.")
        print("Hints, gifts, timing, and all other data are unchanged.")


if __name__ == "__main__":
    asyncio.run(main())
