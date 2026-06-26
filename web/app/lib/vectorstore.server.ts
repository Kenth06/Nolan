/**
 * Vector search over the Vectorize index `nolan-frames` (1536-d, cosine).
 * Metadata indexes for `film` and `dp` were created before upsert, so results can be filtered.
 */

export interface QueryFilter {
  film?: string;
  dp?: string;
}

export interface ScoredId {
  id: string;
  score: number;
}

export async function searchVectors(
  env: Env,
  vector: number[],
  opts: { topK: number; filter?: QueryFilter },
): Promise<ScoredId[]> {
  const filter: Record<string, string> = {};
  if (opts.filter?.film) filter.film = opts.filter.film;
  if (opts.filter?.dp) filter.dp = opts.filter.dp;

  const result = await env.VECTORIZE.query(vector, {
    topK: opts.topK, // capped at 50 when returnMetadata: "all"
    returnMetadata: "all",
    ...(Object.keys(filter).length ? { filter } : {}),
  });

  return result.matches.map((m) => ({ id: m.id, score: m.score }));
}
