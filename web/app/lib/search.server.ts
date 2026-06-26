import { inArray } from "drizzle-orm";
import { embedQuery, type EmbedInput } from "./embeddings.server";
import { searchVectors, type QueryFilter } from "./vectorstore.server";
import { getDb } from "./db";
import { frames } from "./db/schema";
import { FILM_BY_SLUG } from "./corpus";

export interface SearchResultItem {
  id: string;
  film: string;
  title: string;
  year: number;
  dp: string;
  score: number;
  thumbUrl: string;
  frameUrl: string;
}

export interface SearchParams extends EmbedInput {
  filter?: QueryFilter;
  topK?: number;
}

export async function search(env: Env, params: SearchParams): Promise<SearchResultItem[]> {
  const vector = await embedQuery(env, {
    text: params.text,
    imageBase64: params.imageBase64,
    mime: params.mime,
  });

  const scored = await searchVectors(env, vector, {
    topK: params.topK ?? 50,
    filter: params.filter,
  });
  if (scored.length === 0) return [];

  // Join scored ids with D1 metadata (Drizzle ORM), preserving the similarity ordering.
  // Only the opaque publicId leaves the server — internal ids / R2 keys stay hidden.
  const scoreById = new Map(scored.map((s) => [s.id, s.score]));
  const db = getDb(env);
  const rows = await db
    .select({
      id: frames.id,
      publicId: frames.publicId,
      film: frames.film,
      year: frames.year,
      dp: frames.dp,
    })
    .from(frames)
    .where(
      inArray(
        frames.id,
        scored.map((s) => s.id),
      ),
    );

  return rows
    .map((r) => {
      const pid = r.publicId ?? r.id;
      return {
        id: pid,
        film: r.film,
        title: FILM_BY_SLUG[r.film]?.title ?? r.film,
        year: r.year,
        dp: r.dp,
        score: scoreById.get(r.id) ?? 0,
        thumbUrl: `/img/thumb/${pid}`,
        frameUrl: `/img/frame/${pid}`,
      };
    })
    .sort((a, b) => b.score - a.score);
}
