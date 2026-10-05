"""
Seed script — populates all 6 levels, hints, and memory unlocks for Pooja's birthday treasure hunt.
Run once after creating the database:
    python seed.py

Answers are stored server-side only.
Correct answers are normalized (uppercase, trimmed) when compared.
Multiple valid answers can be stored with "|" separator.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.database import Base
from app.models.level import Level
from app.models.hint import Hint
from app.models.gift import Gift
from app.models.photo import Photo


engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)


# ---------------------------------------------------------------------------
# Level data for Pooja's treasure hunt
# Schedule: 5 Oct 2026
#   Level 1 — 21:00 IST (15:30 UTC)
#   Level 2 — 21:30 IST (16:00 UTC)
#   Level 3 — 22:00 IST (16:30 UTC)
#   Level 4 — 22:30 IST (17:00 UTC)
#   Level 5 — 23:00 IST (17:30 UTC)
#   Level 6 — 23:30 IST (18:00 UTC)
#   Birthday reveal — 6 Oct 00:00 IST (5 Oct 18:30 UTC)
#
# NOTE: correct_answer is stored only in the database — NEVER sent to frontend.
# Multiple accepted answers separated by "|"
# ---------------------------------------------------------------------------

LEVELS = [
    {
        "level_number": 1,
        "title": "THE THINGS THAT WERE NEVER REALLY MINE",
        "question": (
            "Ek cupboard.\n"
            "Do bahenen.\n"
            "Aur eternal — \"Ye mera hai!\"\n\n"
            "Chhoti behen thi jo haar roz kuch na kuch utha leti thi...\n"
            "Kabhi lipstick.\n"
            "Kabhi kajal.\n"
            "Kabhi foundation.\n\n"
            "Woh cheez jo Sudha ne sabse zyada 'borrow' ki,\n"
            "aur jo Pooja ne sabse zyada miss ki...\n\n"
            "Ek word mein batao."
        ),
        "options": [],  # text input — no MCQ options
        "correct_answer": "MAKEUP",
        "unlock_time_utc": "2026-10-05T15:30:00Z",
        "deadline_utc": "2026-10-05T16:00:00Z",
        "sub_question": None,
    },
    {
        "level_number": 2,
        "title": "MUD, MAGIC & TWO LITTLE SISTERS",
        "question": (
            "Woh din yaad hai?\n\n"
            "Koi toys nahi the.\n"
            "Koi screen nahi thi.\n"
            "Bas ek angan tha,\n"
            "thodi si mitti,\n"
            "aur do bacchiyaan.\n\n"
            "Usi mitti se hum dono ne poori duniya banate the —\n"
            "ghar, rasoi, aur na jaane kya kya.\n\n"
            "Un mitti ke khelon mein Sudha ki sabse pehli\n"
            "aur sabse pyaari teammate kaun thi?\n\n"
            "(Pehle naam se batao 😊)"
        ),
        "options": [],
        "correct_answer": "POOJA",
        "unlock_time_utc": "2026-10-05T16:00:00Z",
        "deadline_utc": "2026-10-05T16:30:00Z",
        "sub_question": None,
    },
    {
        "level_number": 3,
        "title": "THE FAMILY COURT",
        "question": (
            "Teen siblings.\n"
            "Ek Mummy.\n"
            "Aur ek aisi court jahan case hamesha ek hi taraf jaata tha.\n\n"
            "Chahe galti kisi ki bhi ho —\n"
            "dono bahenen mil jaati thi ek dusre ke saath,\n"
            "aur verdict aksar ek hi taraf aata tha.\n\n"
            "Mummy ki court mein sabse zyada daant kisko padti thi? 😂\n\n"
            "(Jawab mein unhe kya kehte ho, woh likho)"
        ),
        "options": [],
        "correct_answer": "BHAIYA",
        "unlock_time_utc": "2026-10-05T16:30:00Z",
        "deadline_utc": "2026-10-05T17:00:00Z",
        "sub_question": None,
    },
    {
        "level_number": 4,
        "title": "OPERATION JIJU",
        "question": (
            "Ek secret operation.\n\n"
            "Pooja Didi ko lagta tha koi nahi jaanta.\n"
            "Mummy ko lagta tha kuch ho nahi raha.\n"
            "Jiju ko lagta tha plan bilkul perfect hai.\n\n"
            "Lekin ek insaan tha jo sab dekh raha tha...\n"
            "Chup-chaap.\n"
            "Muskura ke.\n"
            "Aur kabhi kabhi door se hi note le raha tha. 👀\n\n"
            "Operation mein tha kya? Sab kuch ya kuch specific?\n\n"
            "(Woh secret kya tha? Ek cheez ya sab kuch? 😏)"
        ),
        "options": [],
        "correct_answer": "SAB KUCH|SABHKUCH|EVERYTHING",
        "unlock_time_utc": "2026-10-05T17:00:00Z",
        "deadline_utc": "2026-10-05T17:30:00Z",
        "sub_question": None,
    },
    {
        "level_number": 5,
        "title": "MAASI DUTY",
        "question": (
            "Shivay.\n\n"
            "Jab bhi Sudha ne use god mein liya,\n"
            "ek cheez almost guaranteed thi.\n\n"
            "Woh moment jo Maasi ko haar baar milta tha —\n"
            "without fail.\n"
            "Without warning.\n"
            "With full enthusiasm. 💀😂\n\n"
            "Shivay ko god mein lene ke baad Sudha ko\n"
            "kis surprise ka sabse zyada chance hota tha?\n\n"
            "(Ek word mein batao 😂)"
        ),
        "options": [],
        "correct_answer": "TOILET|POTTY|SU SU|SUSU|POOP|LATRINE|LAPSI",
        "unlock_time_utc": "2026-10-05T17:30:00Z",
        "deadline_utc": "2026-10-05T18:00:00Z",
        "sub_question": None,
    },
    {
        "level_number": 6,
        "title": "THE DIDI I UNDERSTOOD LATER",
        "question": (
            "College admission ka woh waqt...\n\n"
            "Ghar mein alag alag raayein thi.\n"
            "Bahut kuch hua.\n"
            "Bahut kuch bol diya gaya.\n\n"
            "Us waqt Sudha ko laga —\n"
            "\"Didi bhi mere against hai?\"\n\n"
            "But phir time ke saath, jab dust settle hua,\n"
            "Sudha ko samajh aaya ki Didi ki daant ke peeche\n"
            "kuch aur hi tha.\n\n"
            "Didi ki daant ke peeche usually kya hota hai?\n\n"
            "(Do shabd mein jawab do — jo sach hai woh)"
        ),
        "options": [],
        "correct_answer": "PYAR AUR CONCERN|PYAAR AUR CONCERN|LOVE AND CONCERN|PYAR|PYAAR|LOVE",
        "unlock_time_utc": "2026-10-05T18:00:00Z",
        "deadline_utc": "2026-10-05T18:30:00Z",
        "sub_question": None,
    },
]

HINTS = {
    1: [
        {"hint_number": 1, "hint_text": "Yeh cheez usually ek dabba ya pouch mein hoti hai."},
        {"hint_number": 2, "hint_text": "Lipstick, kajal, foundation... in sab ko milake kya kehte hain?"},
        {"hint_number": 3, "hint_text": "M-A-K-E... aage tumhe pata hai. 😂"},
    ],
    2: [
        {"hint_number": 1, "hint_text": "Woh insaan tumhari sabse gehri dost hai. Aur tumse badi."},
        {"hint_number": 2, "hint_text": "Sudha ne un khelon mein sirf ek hi insaan ke saath khelti thi — apni Didi."},
        {"hint_number": 3, "hint_text": "Tumhara naam. Bas. 😊"},
    ],
    3: [
        {"hint_number": 1, "hint_text": "Teen siblings mein se ek — na Pooja, na Sudha."},
        {"hint_number": 2, "hint_text": "Woh beech mein hai — eldest nahi, youngest nahi."},
        {"hint_number": 3, "hint_text": "B-H-A-I-Y-A. Haan, wahi. 😂"},
    ],
    4: [
        {"hint_number": 1, "hint_text": "Koi ek cheez nahi thi — poora operation tha."},
        {"hint_number": 2, "hint_text": "Jiju ka aana, Pooja ka jaana, sab kuch quietly chal raha tha."},
        {"hint_number": 3, "hint_text": "\"Sab kuch\" — yahi sahi jawab hai. 😏"},
    ],
    5: [
        {"hint_number": 1, "hint_text": "Yeh kuch aisa hai jo chote bacche aksar god mein lete hi karte hain."},
        {"hint_number": 2, "hint_text": "Diaper check? Probably needed. 💀"},
        {"hint_number": 3, "hint_text": "T-O-I-L-E-T. Haan, wahi 'surprise'. 😂"},
    ],
    6: [
        {"hint_number": 1, "hint_text": "Daant kbhi bina wajah nahi aati — kuch toh hota hai peeche."},
        {"hint_number": 2, "hint_text": "Jo cheez tumhe hurt karti hai woh hamesha opposite mein hoti hai."},
        {"hint_number": 3, "hint_text": "Pyar. Aur concern. Dono. Unka style yehi hai. ❤️"},
    ],
}

MEMORY_UNLOCKS = [
    {
        "level_id_ref": 1,
        "title": "💄 Makeup Heist, Confirmed",
        "description": "Tumhe yaad hoga. Sudha ko bhi. Woh lipstick aaj bhi ghum hai.",
        "gift_type": "memory",
        "content": (
            '{"message": "ACCESS GRANTED 💄😂\\n\\n'
            'Obviously tumhe yaad hoga.\\n'
            'Tumhari chhoti behen ne tumhara makeup kabhi tumhara rehne hi nahi diya.\\n\\n'
            'Ek cupboard. Do bahenen. Aur jo lip colour tha woh subah gaya toh shaam tak Sudha ke paas tha.\\n\\n'
            'Bura mat mano, Didi — tumhe pata tha yeh hoga. 😂", '
            '"emoji": "💄"}'
        ),
    },
    {
        "level_id_ref": 2,
        "title": "🌱 Mitti Ke Din",
        "description": "Woh angan, woh mitti, aur tum dono.",
        "gift_type": "memory",
        "content": (
            '{"message": "Mitti ke woh games shayad chhote the...\\n\\n'
            'par unmein jo duniya hum dono bana lete the, woh bahut badi thi. ❤️\\n\\n'
            'Koi toy nahi, koi screen nahi —\\n'
            'bas ek angan, thodi mitti,\\n'
            'aur ek badi behen jo chhoti behen ki poori imagination ke saath khel leti thi.\\n\\n'
            'Woh duniya real thi, Didi.", '
            '"emoji": "🌱"}'
        ),
    },
    {
        "level_id_ref": 3,
        "title": "⚖️ Family Court: Verdict",
        "description": "Evidence clear tha. Witnesses biased the. Judge Mummy thi.",
        "gift_type": "memory",
        "content": (
            '{"message": "VERDICT: BHAIYA AGAIN. 😂\\n\\n'
            'Evidence clear tha.\\n'
            'Witnesses biased the.\\n'
            'Judge Mummy thi.\\n\\n'
            'Case closed.\\n\\n'
            'Aur hum dono — Pooja aur Sudha —\\n'
            'mostly silent spectators the. Mostly. 😂\\n\\n'
            'Yeh woh bond tha jo sirf do bahenen share karti hain —\\n'
            'ek chup rahe, dusri bhi chup rahe,\\n'
            'aur bhaiya kehte rahe \'meri galti nahi thi.\'", '
            '"emoji": "⚖️"}'
        ),
    },
    {
        "level_id_ref": 4,
        "title": "🤫 Operation Jiju: File Opened",
        "description": "Mission secret tha. Sudha ki aankhon se kuch nahi bachta tha.",
        "gift_type": "memory",
        "content": (
            '{"message": "OPERATION JIJU — SUCCESSFUL 🤫😂\\n\\n'
            'Mission kaafi secret tha...\\n\\n'
            'lekin Sudha ki aankhon se kuch nahi bachta tha.\\n\\n'
            'Chhoti behen ka yeh kaam tha ki woh note kare,\\n'
            'muskurae,\\n'
            'aur kabhi kabhi ek meaningful nazar se Didi ko inform kare\\n'
            'ki \'haan, main jaanti hoon.\'\\n\\n'
            'Koi baat nahi Didi — sab theek nikla. ❤️", '
            '"emoji": "🤫"}'
        ),
    },
    {
        "level_id_ref": 5,
        "title": "🍼 Maasi Alert Activated",
        "description": "Shivay — technically Pooja ka beta, emotionally Sudha ka pehla bachcha.",
        "gift_type": "memory",
        "content": (
            '{"message": "MAASI LEVEL PASSED! 🍼😂\\n\\n'
            'Tumhara beta hai...\\n'
            'technically mera beta nahi...\\n\\n'
            'but dil se?\\n'
            'He will always be my first baby. ❤️\\n\\n'
            'Aur woh surprise?\\n'
            'Woh bhi ek yaad hai ab — '
            'jo har baar yaad aati hai aur hansaati hai.\\n\\n'
            'Shivay ko god mein lene ka matlab tha —\\n'
            'ek naya surprise incoming. 💀😂", '
            '"emoji": "🍼"}'
        ),
    },
    {
        "level_id_ref": 6,
        "title": "❤️ The Didi I Understand Now",
        "description": "Daant ke peeche wala saccha jawab.",
        "gift_type": "memory",
        "content": (
            '{"message": "YOU GOT IT. ❤️\\n\\n'
            'Shayad main har baar tumhari baat us waqt nahi samajhti...\\n\\n'
            'but eventually, I do.\\n\\n'
            'Aur shayad isi ko Didi hona kehte hain.\\n\\n'
            'Kabhi daantna.\\n'
            'Kabhi rokna.\\n'
            'Kabhi samjhana.\\n'
            'Aur jab zarurat ho...\\n'
            'bas chup-chaap side mein khade rehna.\\n\\n'
            'Main jaanti hoon, Didi.\\n'
            'Main ab jaanti hoon.", '
            '"emoji": "❤️"}'
        ),
    },
]

PHOTOS = [
    {"filename": "memory-01.jpg", "order": 1, "category": "childhood", "caption": "Bachpan ke din"},
    {"filename": "memory-02.jpg", "order": 2, "category": "childhood", "caption": "Hum dono"},
    {"filename": "memory-03.jpg", "order": 3, "category": "family", "caption": "Ghar waale"},
    {"filename": "memory-04.jpg", "order": 4, "category": "family", "caption": "Saath ke pal"},
    {"filename": "memory-05.jpg", "order": 5, "category": "special", "caption": "Kuch khaas lamhe"},
    {"filename": "memory-06.jpg", "order": 6, "category": "special", "caption": "Yaadein"},
    {"filename": "memory-07.jpg", "order": 7, "category": "shivay", "caption": "Shivay ❤️"},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession() as session:
        # Check if already seeded
        existing = await session.execute(select(Level).limit(1))
        if existing.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            print("To re-seed, drop and recreate the database first.")
            return

        # Seed levels
        level_map = {}
        for ldata in LEVELS:
            sub = ldata.pop("sub_question", None)
            lvl = Level(**ldata, sub_question=sub)
            session.add(lvl)
            await session.flush()
            level_map[ldata["level_number"]] = lvl.id
            print(f"  Created Level {ldata['level_number']}: {ldata['title']}")

        await session.flush()

        # Seed hints
        for ln, hint_list in HINTS.items():
            lid = level_map[ln]
            for h in hint_list:
                hint = Hint(level_id=lid, **h)
                session.add(hint)
            print(f"  Created {len(hint_list)} hints for Level {ln}")

        # Seed memory unlocks (gifts)
        for gdata in MEMORY_UNLOCKS:
            ref = gdata.pop("level_id_ref")
            lid = level_map[ref]
            gift = Gift(level_id=lid, **gdata)
            session.add(gift)
            print(f"  Created memory for Level {ref}: {gdata['title']}")

        # Seed photo placeholders
        for pdata in PHOTOS:
            photo = Photo(**pdata)
            session.add(photo)
        print(f"  Created {len(PHOTOS)} photo placeholders")

        await session.commit()
        print("\n✅ Seed completed successfully!")
        print("\nIMPORTANT: Correct answers are stored in the database only.")
        print("They are NEVER sent to the frontend.")
        print("\nLevel schedule (IST):")
        print("  Level 1 — 5 Oct 9:00 PM")
        print("  Level 2 — 5 Oct 9:30 PM")
        print("  Level 3 — 5 Oct 10:00 PM")
        print("  Level 4 — 5 Oct 10:30 PM")
        print("  Level 5 — 5 Oct 11:00 PM")
        print("  Level 6 — 5 Oct 11:30 PM")
        print("  Birthday Reveal — 6 Oct 12:00 AM")


if __name__ == "__main__":
    asyncio.run(seed())
