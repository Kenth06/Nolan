/**
 * Vector search over the Vectorize index `nolan-frames` (1536-d, cosine). Only ids and scores are
 * needed here — frame metadata is joined from D1 — so the query returns neither values nor
 * metadata (which also lifts the topK ceiling to 100).
 */

export interface ScoredId {
  id: string;
  score: number;
}

export async function searchVectors(env: Env, vector: number[], topK: number): Promise<ScoredId[]> {
  const result = await env.VECTORIZE.query(vector, { topK, returnMetadata: "none" });
  return result.matches.map((m) => ({ id: m.id, score: m.score }));
}
