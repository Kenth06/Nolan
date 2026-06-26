-- Add an opaque public id for images so the R2 corpus can't be enumerated by guessing keys.
-- Values are populated out-of-band (private pipeline); this migration is schema-only.
ALTER TABLE frames ADD COLUMN public_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_frames_public_id ON frames (public_id);
