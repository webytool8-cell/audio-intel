-- Audio Intel Database Schema

-- ─── Phase 1 ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sounds (
  id             TEXT PRIMARY KEY,
  platform       TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  sound_url      TEXT NOT NULL,
  embed_url      TEXT NOT NULL,
  title          TEXT NOT NULL,
  artist         TEXT NOT NULL,
  duration       INTEGER NOT NULL DEFAULT 0,
  trend_score    FLOAT NOT NULL DEFAULT 0,
  velocity_score FLOAT NOT NULL DEFAULT 0,
  reuse_count    INTEGER NOT NULL DEFAULT 0,
  category       TEXT NOT NULL DEFAULT 'Other',
  mood           TEXT NOT NULL DEFAULT 'Energetic',
  tags           JSONB NOT NULL DEFAULT '[]',
  -- Phase 2 extensions
  bpm            INTEGER,
  energy_level   INTEGER,
  best_segments  JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sounds_trend_score ON sounds (trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_sounds_category    ON sounds (category);
CREATE INDEX IF NOT EXISTS idx_sounds_platform    ON sounds (platform);

CREATE TABLE IF NOT EXISTS trends_history (
  id          SERIAL PRIMARY KEY,
  sound_id    TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views       INTEGER NOT NULL DEFAULT 0,
  uses        INTEGER NOT NULL DEFAULT 0,
  growth_rate FLOAT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trends_history_sound_id ON trends_history (sound_id, timestamp DESC);

-- ─── Phase 2 ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clips (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  tags         JSONB NOT NULL DEFAULT '[]',
  tempo        INTEGER NOT NULL DEFAULT 0,
  energy       INTEGER NOT NULL DEFAULT 5,
  duration     INTEGER NOT NULL DEFAULT 0,
  file_url     TEXT NOT NULL DEFAULT '',
  ai_mood      TEXT,
  ai_pace      TEXT,
  ai_category  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id         SERIAL PRIMARY KEY,
  clip_id    TEXT NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  sound_id   TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
  score      FLOAT NOT NULL DEFAULT 0,
  start_time INTEGER NOT NULL DEFAULT 0,
  end_time   INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_clip_id ON matches (clip_id, score DESC);
