import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * One row per curated still — canonical metadata. The vector itself lives in Vectorize;
 * {film, year, dp} are also stored in Vectorize metadata for filtering, and here as the
 * source of truth joined to search hits by id.
 *
 * `publicId` is an opaque random id (nanoid) used in image URLs so the R2 corpus can't be
 * enumerated by guessing `${film}_${nnn}`. The internal `id` (= the R2 key base) is never
 * exposed; the image route resolves publicId -> id server-side.
 */
export const frames = sqliteTable(
  "frames",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id"),
    film: text("film").notNull(),
    year: integer("year").notNull(),
    dp: text("dp").notNull(),
  },
  (t) => [
    index("idx_frames_film").on(t.film),
    index("idx_frames_dp").on(t.dp),
    uniqueIndex("idx_frames_public_id").on(t.publicId),
  ],
);

export type FrameRow = typeof frames.$inferSelect;
