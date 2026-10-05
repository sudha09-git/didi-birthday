# 🌸 Pooja Didi — 26th Birthday Treasure Hunt

A complete, production-quality **full-stack interactive birthday treasure hunt** built for Pooja Didi's 26th birthday on **6 October 2026**, created by her youngest sister Sudha.

This is not a birthday landing page. It is a **3-hour interactive sister treasure hunt + memory website** that Pooja plays solo starting at **9:00 PM IST on 5 October**, completing 6 timed levels before midnight unlocks the birthday reveal.

---

## Architecture

```
piyush-birthday/
├── frontend/          React + Vite (port 5173)
├── backend/           FastAPI + Python (port 8000)
│   ├── app/
│   │   ├── models/    SQLAlchemy ORM models
│   │   ├── schemas/   Pydantic request/response models
│   │   ├── routes/    game.py, admin.py
│   │   ├── services/  game_service.py (all timing & game logic)
│   │   └── utils/     auth.py (JWT admin auth)
│   └── seed.py        One-time DB seeder
├── database/
│   └── schema.sql     PostgreSQL schema reference
└── README.md
```

**Security principle:** Correct answers are stored **only** in PostgreSQL. They are never sent to the frontend. The backend validates every attempt server-side.

---

## Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.11+
- **PostgreSQL** 14+

---

## Quick Start

### 1. Clone and navigate

```bash
cd piyush-birthday
```

### 2. PostgreSQL setup

```sql
-- In psql or pgAdmin:
CREATE DATABASE piyush_birthday;
```

### 3. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secret keys

# Seed the database (creates tables + inserts all 5 levels, hints, gifts)
python seed.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend will be live at: `http://localhost:8000`  
Swagger docs (dev only): `http://localhost:8000/docs`

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Async PostgreSQL URL (`postgresql+asyncpg://...`) |
| `SYNC_DATABASE_URL` | Sync PostgreSQL URL (for Alembic if needed) |
| `ADMIN_USERNAME` | Admin dashboard username |
| `ADMIN_PASSWORD` | Admin dashboard password |
| `ADMIN_SECRET_KEY` | JWT signing key for admin tokens |
| `SECRET_KEY` | App-level secret key |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `GAME_TEST_MODE` | `true` to bypass date locks during development |
| `TEST_GAME_START_TIME` | UTC ISO time to simulate as game start (test mode only) |

---

## Test Mode

To test the full game without waiting for 5 October 2026:

1. In `backend/.env`:
   ```
   GAME_TEST_MODE=true
   TEST_GAME_START_TIME=2026-10-05T15:25:00Z
   ```
   Set `TEST_GAME_START_TIME` to **5 minutes before now** in UTC. The game will start in 5 minutes, and each level will unlock every 36 minutes from that point.

2. The birthday world unlocks 3 hours after game start (same as real schedule).

3. **Never** enable `GAME_TEST_MODE` in production.

---

## Admin Dashboard

Navigate to `http://localhost:5173/admin`

**Login** with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env`.

The admin dashboard shows:
- All players, their current level, completed levels
- Per-level: total attempts, hints used, solve time
- Server time (IST) and birthday unlock status
- Level editor: edit questions, answers, unlock times without touching source code

---

## Game Schedule (Real)

| Event | Time IST | UTC |
|---|---|---|
| Game starts | 5 Oct 2026 — 9:00 PM | 2026-10-05T15:30:00Z |
| Level 1 | 9:00 PM – 9:36 PM | T15:30 – T16:06 |
| Level 2 | 9:36 PM – 10:12 PM | T16:06 – T16:42 |
| Level 3 | 10:12 PM – 10:48 PM | T16:42 – T17:18 |
| Level 4 | 10:48 PM – 11:24 PM | T17:18 – T17:54 |
| Level 5 | 11:24 PM – 12:00 AM | T17:54 – T18:30 |
| Birthday world | 6 Oct 2026 — 12:00 AM | 2026-10-05T18:30:00Z |

**Important:** Even if Piyush completes a level early, the next level stays locked until its scheduled time. The server enforces this — the client clock is never trusted.

---

## Adding Real Photos

1. Place your photos in `frontend/public/photos/`
   - Name them: `photo01.jpg`, `photo02.jpg`, … (or any name)
2. Update the database:
   ```sql
   UPDATE photos SET filename='photo01.jpg' WHERE "order"=1;
   UPDATE photos SET filename='photo02.jpg' WHERE "order"=2;
   -- etc.
   ```
   Or delete all photo rows and re-run `python seed.py` after updating `PHOTOS` in `seed.py`.
3. The photo wall adapts automatically to however many photos exist.

---

## Adding Background Music

1. Obtain a legal copy of "Tenu Sang Rakhna" (MP3).
2. Place it at `frontend/public/audio/tenu-sang-rakhna.mp3`.
3. The music player on the Our Story page will find it automatically.
4. Music is **never autoplayed** — Piyush clicks play.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/game/server-time` | Server UTC + IST time, game state flags |
| `POST` | `/api/game/start` | Start game, get session ID |
| `GET` | `/api/game/state` | Full game state (requires `x-session-id` header) |
| `GET` | `/api/game/current-level` | Current available level + question |
| `POST` | `/api/game/attempt` | Submit answer |
| `POST` | `/api/game/hint` | Request a hint |
| `GET` | `/api/game/gifts` | All gifts (unlocked/locked status) |
| `GET` | `/api/game/photos` | Photo list |
| `POST` | `/api/admin/login` | Admin login → JWT token |
| `GET` | `/api/admin/stats` | All player + level stats (auth required) |
| `GET` | `/api/admin/levels` | All levels with answers (auth required) |
| `PATCH` | `/api/admin/levels/{id}` | Update a level (auth required) |

---

## Production Build

```bash
# Frontend
cd frontend
npm run build
# Output: frontend/dist/

# Backend
# Set APP_ENV=production in .env
# Deploy with gunicorn or uvicorn behind nginx:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

Serve `frontend/dist/` with nginx or any static host, proxying `/api/*` to the FastAPI backend.

---

## Checklist Before Game Night

- [ ] PostgreSQL is running and `piyush_birthday` database exists
- [ ] `python seed.py` completed successfully
- [ ] Backend starts without errors (`uvicorn app.main:app --reload`)
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Admin login works at `/admin`
- [ ] `GAME_TEST_MODE=false` in production `.env`
- [ ] Real photos placed in `frontend/public/photos/` (optional but recommended)
- [ ] Music file placed at `frontend/public/audio/tenu-sang-rakhna.mp3` (optional)
- [ ] Server time matches IST (check `/api/game/server-time`)
- [ ] Share the URL with Piyush exactly at 9:00 PM IST on 5 October 2026 🐒

---

*Made with 🤍 by Chutki for Bandarr's 20th Birthday*
