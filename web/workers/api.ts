import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { search } from "../app/lib/search.server";
import { getDb } from "../app/lib/db";
import { frames } from "../app/lib/db/schema";

// Opaque image id = SHA-256 hex (generateHash convention). Reject anything else so the old
// guessable `${film}_${nnn}` keys can't be probed.
const PUBLIC_ID = /^[a-f0-9]{64}$/;

const api = new Hono<{ Bindings: Env }>();

/**
 * POST /api/search — text→image semantic search. Rate limited per client IP so the endpoint
 * (and the paid Gemini embedding behind it) can't be spammed.
 */
api.post("/api/search", async (c) => {
  const env = c.env;

  const ip = c.req.header("cf-connecting-ip") ?? "anon";
  const { success } = await env.SEARCH_LIMITER.limit({ key: ip });
  if (!success) {
    return c.json({ error: "Too many searches — please wait a moment." }, 429);
  }

  let body: { q?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request." }, 400);
  }

  const text = body.q?.trim();
  if (!text) return c.json({ error: "Type something to search." }, 400);
  if (text.length > 200) return c.json({ error: "Query is too long." }, 400);

  try {
    const results = await search(env, { text, topK: 50 });
    return c.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /img/:type/:publicId — stream a thumbnail or full frame from R2. The public id is opaque;
 * R2 is private, so the corpus can only be reached one image at a time via a known public id
 * (which only comes back from a rate-limited search). publicId -> internal key is resolved here.
 */
api.get("/img/:type/:publicId", async (c) => {
  const type = c.req.param("type");
  const publicId = c.req.param("publicId");

  if (type !== "thumb" && type !== "frame") return c.notFound();
  if (!PUBLIC_ID.test(publicId)) return c.text("Bad request", 400);

  const row = await getDb(c.env)
    .select({ id: frames.id })
    .from(frames)
    .where(eq(frames.publicId, publicId))
    .get();
  if (!row) return c.notFound();

  const bucket = type === "thumb" ? c.env.THUMBS : c.env.FRAMES;
  const object = await bucket.get(`${row.id}.webp`);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("content-type", "image/webp");
  return new Response(object.body, { headers });
});

export { api };
