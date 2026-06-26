import { inArray } from "drizzle-orm";
import { getDb } from "./db";
import { frames } from "./db/schema";

// A curated spread across the twelve films for the idle hero. Resolved to opaque public ids
// server-side so the hashes never live in the client bundle / repo.
const PREVIEW_INTERNAL = [
  "following_007", "memento_021", "insomnia_018", "batman-begins_030",
  "the-prestige_012", "the-dark-knight_040", "inception_026", "the-dark-knight-rises_015",
  "interstellar_035", "dunkirk_022", "tenet_031", "oppenheimer_037",
  "interstellar_010", "inception_042", "dunkirk_040", "oppenheimer_012",
];

export const PREVIEW_COUNT = PREVIEW_INTERNAL.length;

export async function getPreviewIds(env: Env): Promise<string[]> {
  const rows = await getDb(env)
    .select({ id: frames.id, publicId: frames.publicId })
    .from(frames)
    .where(inArray(frames.id, PREVIEW_INTERNAL));

  const byId = new Map(rows.map((r) => [r.id, r.publicId]));
  return PREVIEW_INTERNAL.map((id) => byId.get(id)).filter((p): p is string => !!p);
}
