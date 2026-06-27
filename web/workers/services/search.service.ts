import { embedQuery } from "./embeddings.service";
import { searchVectors } from "./vectorize.service";
import { findByIds } from "./frames.service";
import { FILM_BY_SLUG } from "../../app/lib/corpus";

/**
 * A ranked search hit. Transport-agnostic: it carries the opaque public id and the film facts
 * (resolved from the corpus), but not image URLs — those are a presentation concern built by the
 * controller.
 */
export interface SearchHit {
  id: string;
  film: string;
  title: string;
  year: number;
  dp: string;
  score: number;
}

const TOP_K = 50;

/** Embed the query, find nearest frames in Vectorize, and join their corpus facts from D1. */
export async function search(env: Env, text: string): Promise<SearchHit[]> {
  const vector = await embedQuery(env, text);
  const scored = await searchVectors(env, vector, TOP_K);
  if (scored.length === 0) return [];

  const scoreById = new Map(scored.map((s) => [s.id, s.score]));
  const refs = await findByIds(
    env,
    scored.map((s) => s.id),
  );

  return refs
    .map((r) => {
      const film = FILM_BY_SLUG[r.film];
      return {
        id: r.publicId,
        film: r.film,
        title: film?.title ?? r.film,
        year: film?.year ?? 0,
        dp: film?.dp ?? "",
        score: scoreById.get(r.id) ?? 0,
      };
    })
    .sort((a, b) => b.score - a.score);
}
