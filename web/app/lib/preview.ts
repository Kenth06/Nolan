/**
 * The curated idle-hero stills — a fixed spread across the twelve films, shown to everyone as
 * decoration. `scripts/preview-assets.mjs` copies these keys' thumbs into web/public/previews/ as
 * 0..N.webp, served as static CDN assets (no API, no D1). The stills are copyright, so the output
 * folder is gitignored — they ship with the deploy but never enter the repo. PREVIEW_COUNT drives
 * the idle layout in home.tsx.
 */
export const PREVIEW_KEYS = [
  "following_007", "memento_021", "insomnia_018", "batman-begins_030",
  "the-prestige_012", "the-dark-knight_040", "inception_026", "the-dark-knight-rises_015",
  "interstellar_035", "dunkirk_022", "tenet_031", "oppenheimer_037",
  "interstellar_010", "inception_042", "dunkirk_040", "oppenheimer_012",
] as const;

export const PREVIEW_COUNT = PREVIEW_KEYS.length;
