# Nolan

**Search every Christopher Nolan film by meaning.** Type a scene, a person, an object, or a
colour — Nolan finds the matching stills across the director's twelve films. No tags, no
keywords: it understands what you mean.

A small showcase of **multimodal embeddings + semantic search** on the Cloudflare developer
platform. Stills are embedded with **Google Gemini** (`gemini-embedding-2`) and searched with
**Cloudflare Vectorize** — text and images share one vector space, so a typed description finds
the frames it *looks* like.

## How it works

```
                 ┌──────────────────────────────────────────────────────────┐
   "rain at      │  Worker (Hono + React Router on Cloudflare Workers)        │
    night"  ───▶ │                                                            │
                 │  1. embed the query    → AI Gateway → Gemini embedding-2   │
                 │                          (1536-d, multimodal space)        │
                 │  2. nearest neighbours → Vectorize  (cosine, top-K)        │
                 │  3. join metadata      → D1 (Drizzle ORM)                  │
                 │  4. stream stills      → R2 (private, opaque ids)          │
                 └──────────────────────────────────────────────────────────┘
```

Every still in the corpus was embedded **once** with Gemini and upserted into Vectorize. At
query time the same model embeds the search text into the *same* space, Vectorize returns the
closest frames by cosine similarity, and their metadata is joined from D1. Because Gemini's
embeddings are multimodal, a text query and an image live in one shared space — searching by
meaning "just works".

## Features

- **Natural-language semantic search** — "a lone figure against vast emptiness", "warm tungsten
  interior", "spinning top on a table" — ranked by visual meaning, not keywords.
- **Results across the whole filmography** — a single query surfaces matching frames from
  multiple films at once, in a responsive grid with a lightbox.
- **A calm, motion-driven UI** — a drifting wall of stills on the idle screen, staggered
  result reveals, and a spring lightbox (Motion / `motion/react`).

## Tech stack

- **Full-stack React on Cloudflare Workers** — React Router v7 (SSR) + **Hono** for the JSON API
- **Google Gemini** `gemini-embedding-2` via **Cloudflare AI Gateway** (caching, observability)
- **Cloudflare Vectorize** — 1536-d cosine index with filterable metadata
- **Cloudflare D1** + **Drizzle ORM** — frame metadata (no raw SQL)
- **Cloudflare R2** — image storage, served privately as WebP
- **TailwindCSS v4** + **TypeScript**

## Security

- **No corpus enumeration** — R2 is private and image URLs use opaque, random ids; the route
  resolves them to internal keys server-side, and guessable keys are rejected.
- **Rate-limited search** — a Workers rate-limit binding caps requests per IP, protecting the
  endpoint (and the paid embedding behind it) from abuse.

## Project layout

```
web/
  app/
    routes/home.tsx        search UI: hero, results grid, lightbox
    lib/
      embeddings.server.ts Gemini embeddings via AI Gateway
      vectorstore.server.ts Vectorize query
      search.server.ts     orchestration (embed → search → join)
      db/                  Drizzle schema + D1 client
    app.css                design tokens (light theme)
  workers/
    app.ts                 routes API/images to Hono, UI to React Router
    api.ts                 Hono: rate-limited /api/search, secured /img/:type/:id
  migrations/              D1 schema migrations
  wrangler.jsonc           Workers bindings (AI, Vectorize, R2, D1, rate limit)
```

## Notes

The film stills are used for personal/educational demonstration and are **not** included in
this repository. The embedding/ingestion pipeline and the corpus live outside version control.
The implementation is written from scratch against the official Cloudflare and Google docs.

## License

[MIT](./LICENSE)
