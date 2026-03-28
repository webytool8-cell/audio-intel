-- Audio Intel Database Schema

CREATE TABLE IF NOT EXISTS sounds (
  id          TEXT PRIMARY KEY,
  platform    TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  sound_url   TEXT NOT NULL,
  embed_url   TEXT NOT NULL,
  title       TEXT NOT NULL,
  artist      TEXT NOT NULL,
  duration    INTEGER NOT NULL DEFAULT 0,
  trend_score FLOAT NOT NULL DEFAULT 0,
  velocity_score FLOAT NOT NULL DEFAULT 0,
  reuse_count INTEGER NOT NULL DEFAULT 0,
  category    TEXT NOT NULL DEFAULT 'Other',
  mood        TEXT NOT NULL DEFAULT 'Energetic',
  tags        JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sounds_trend_score ON sounds (trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_sounds_category ON sounds (category);
CREATE INDEX IF NOT EXISTS idx_sounds_platform ON sounds (platform);

CREATE TABLE IF NOT EXISTS trends_history (
  id          SERIAL PRIMARY KEY,
  sound_id    TEXT NOT NULL REFERENCES sounds(id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views       INTEGER NOT NULL DEFAULT 0,
  uses        INTEGER NOT NULL DEFAULT 0,
  growth_rate FLOAT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_trends_history_sound_id ON trends_history (sound_id, timestamp DESC);
