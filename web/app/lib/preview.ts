/**
 * The curated idle-hero stills — a fixed spread across the twelve films, shown to everyone as
 * decoration. These are referenced by index via `/img/preview/:index`, so they need no opaque
 * public id and no per-request D1 lookup. The internal R2 keys stay server-side; the route maps
 * an index to a key, never exposing the key or a path to the rest of the (protected) corpus.
 */
export const PREVIEW_KEYS = [
  "following_007", "memento_021", "insomnia_018", "batman-begins_030",
  "the-prestige_012", "the-dark-knight_040", "inception_026", "the-dark-knight-rises_015",
  "interstellar_035", "dunkirk_022", "tenet_031", "oppenheimer_037",
  "interstellar_010", "inception_042", "dunkirk_040", "oppenheimer_012",
] as const;

export const PREVIEW_COUNT = PREVIEW_KEYS.length;
