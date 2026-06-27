-- corpus.ts is the single source of truth for {title, year, dp}, all derived from the film slug,
-- so the per-frame `year`/`dp` columns (and the dp index) are redundant. Drop them; D1 now stores
-- only identity columns {id, public_id, film}.
DROP INDEX IF EXISTS idx_frames_dp;
ALTER TABLE frames DROP COLUMN dp;
ALTER TABLE frames DROP COLUMN year;
