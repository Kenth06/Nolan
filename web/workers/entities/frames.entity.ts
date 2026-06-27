import { sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * One row per curated still. The vector lives in Vectorize; the canonical {title, year, dp} for a
 * frame come from its `film` slug via `corpus.ts` (single source of truth), so D1 stores only the
 * identity columns: the internal `id` (= the R2 key base), the `film` slug, and the opaque
 * `publicId`.
 *
 * `publicId` is a SHA-256 hex of random bytes (the `generateHash` convention), used in image URLs
 * so the R2 corpus can't be enumerated by guessing `${film}_${nnn}`. The internal `id` is never
 * exposed; the image route resolves publicId -> id server-side.
 */
export const frames = sqliteTable(
  "frames",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id"),
    film: text("film").notNull(),
  },
  (t) => [
    index("idx_frames_film").on(t.film),
    uniqueIndex("idx_frames_public_id").on(t.publicId),
  ],
);

export type FrameRow = typeof frames.$inferSelect;
