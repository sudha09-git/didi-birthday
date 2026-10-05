-- Pooja Birthday Treasure Hunt — PostgreSQL Schema
-- Run this manually OR let SQLAlchemy/seed.py create the tables automatically.

CREATE TABLE IF NOT EXISTS players (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL DEFAULT 'Pooja',
    session_id  VARCHAR(64)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);

CREATE TABLE IF NOT EXISTS levels (
    id               SERIAL PRIMARY KEY,
    level_number     INTEGER      NOT NULL UNIQUE,
    title            VARCHAR(200) NOT NULL,
    question         TEXT         NOT NULL,
    options          JSONB        NOT NULL,
    correct_answer   VARCHAR(10)  NOT NULL,
    unlock_time_utc  VARCHAR(50)  NOT NULL,
    deadline_utc     VARCHAR(50)  NOT NULL,
    sub_question     JSONB,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_levels_number ON levels(level_number);

CREATE TABLE IF NOT EXISTS hints (
    id           SERIAL PRIMARY KEY,
    level_id     INTEGER      NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    hint_number  INTEGER      NOT NULL,
    hint_text    VARCHAR(1000) NOT NULL,
    cost         INTEGER      NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_hints_level ON hints(level_id);

CREATE TABLE IF NOT EXISTS attempts (
    id              SERIAL PRIMARY KEY,
    player_id       INTEGER     NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    level_id        INTEGER     NOT NULL REFERENCES levels(id),
    selected_answer VARCHAR(10) NOT NULL,
    is_correct      BOOLEAN     NOT NULL DEFAULT FALSE,
    attempt_number  INTEGER     NOT NULL DEFAULT 1,
    question_type   VARCHAR(10) NOT NULL DEFAULT 'main',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_player ON attempts(player_id);
CREATE INDEX IF NOT EXISTS idx_attempts_level  ON attempts(level_id);

CREATE TABLE IF NOT EXISTS hint_usage (
    id         SERIAL PRIMARY KEY,
    player_id  INTEGER     NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    level_id   INTEGER     NOT NULL REFERENCES levels(id),
    hint_id    INTEGER     NOT NULL REFERENCES hints(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hint_usage_player ON hint_usage(player_id);

CREATE TABLE IF NOT EXISTS progress (
    id               SERIAL PRIMARY KEY,
    player_id        INTEGER     NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    current_level    INTEGER     NOT NULL DEFAULT 1,
    completed_levels JSONB       NOT NULL DEFAULT '[]',
    level5_main_done BOOLEAN     NOT NULL DEFAULT FALSE,
    game_started     BOOLEAN     NOT NULL DEFAULT FALSE,
    final_unlocked   BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_progress_player ON progress(player_id);

CREATE TABLE IF NOT EXISTS gifts (
    id          SERIAL PRIMARY KEY,
    level_id    INTEGER      NOT NULL UNIQUE REFERENCES levels(id),
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    gift_type   VARCHAR(50)  NOT NULL DEFAULT 'text',
    content     TEXT,
    image       VARCHAR(500),
    unlocked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_unlocks (
    id         SERIAL PRIMARY KEY,
    player_id  INTEGER     NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    gift_id    INTEGER     NOT NULL REFERENCES gifts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_unlocks_player ON gift_unlocks(player_id);

CREATE TABLE IF NOT EXISTS photos (
    id         SERIAL PRIMARY KEY,
    filename   VARCHAR(200) NOT NULL,
    "order"    INTEGER      NOT NULL DEFAULT 0,
    category   VARCHAR(100) NOT NULL DEFAULT 'general',
    caption    VARCHAR(500),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
