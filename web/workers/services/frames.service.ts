import { eq, inArray } from "drizzle-orm";
import { getDb } from "../common/database";
import { frames } from "../entities/frames.entity";

/** Data access for the `frames` table — the only place that knows how frames are read from D1. */

/** Resolve an opaque public id to its internal R2 key base, or null if unknown. */
export async function findIdByPublicId(env: Env, publicId: string): Promise<string | null> {
  const row = await getDb(env)
    .select({ id: frames.id })
    .from(frames)
    .where(eq(frames.publicId, publicId))
    .get();
  return row?.id ?? null;
}

export interface FrameRef {
  id: string;
  publicId: string;
  film: string;
}

/** Fetch identity columns for a set of internal ids. Rows lacking a publicId are dropped. */
export async function findByIds(env: Env, ids: string[]): Promise<FrameRef[]> {
  if (ids.length === 0) return [];
  const rows = await getDb(env)
    .select({ id: frames.id, publicId: frames.publicId, film: frames.film })
    .from(frames)
    .where(inArray(frames.id, ids));
  return rows.flatMap((r) => (r.publicId ? [{ id: r.id, publicId: r.publicId, film: r.film }] : []));
}
