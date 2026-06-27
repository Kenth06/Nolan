import { describe, it, expect } from "vitest";
import { FILMS, FILM_BY_SLUG } from "../app/lib/corpus";
import { PREVIEW_KEYS, PREVIEW_COUNT } from "../app/lib/preview";

describe("corpus", () => {
  it("covers all twelve Nolan films with unique slugs", () => {
    expect(FILMS).toHaveLength(12);
    expect(new Set(FILMS.map((f) => f.slug)).size).toBe(12);
  });

  it("indexes every film by slug", () => {
    for (const f of FILMS) {
      expect(FILM_BY_SLUG[f.slug]).toEqual(f);
    }
  });
});

describe("preview keys", () => {
  it("are unique and counted", () => {
    expect(PREVIEW_KEYS).toHaveLength(PREVIEW_COUNT);
    expect(new Set(PREVIEW_KEYS).size).toBe(PREVIEW_COUNT);
  });

  it("reference known film slugs", () => {
    const slugs = new Set(FILMS.map((f) => f.slug));
    for (const key of PREVIEW_KEYS) {
      const slug = key.slice(0, key.lastIndexOf("_"));
      expect(slugs.has(slug)).toBe(true);
    }
  });
});
