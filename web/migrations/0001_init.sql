-- Nolan — initial schema. Applied with `wrangler d1 migrations apply nolan-db [--local|--remote]`.
CREATE TABLE IF NOT EXISTS frames (
  id    TEXT PRIMARY KEY,
  film  TEXT NOT NULL,
  year  INTEGER NOT NULL,
  dp    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_frames_film ON frames (film);
CREATE INDEX IF NOT EXISTS idx_frames_dp ON frames (dp);
