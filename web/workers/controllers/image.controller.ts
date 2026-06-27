import { Hono } from "hono";
import { findIdByPublicId } from "../services/frames.service";
import type { HonoEnv } from "../common/types";

export const imageController = new Hono<HonoEnv>();

// Opaque image id = SHA-256 hex (generateHash convention). Reject anything else so the old
// guessable `${film}_${nnn}` keys can't be probed.
const PUBLIC_ID = /^[a-f0-9]{64}$/;

/**
 * GET /img/:type/:publicId — stream a thumbnail or full frame from R2. The public id is opaque;
 * R2 is private, so the corpus can only be reached one image at a time via a known public id
 * (which only comes back from a rate-limited search). publicId -> internal key is resolved here.
 * (The decorative idle-hero stills are static assets, not this route.)
 */
imageController.get("/img/:type/:publicId", async (c) => {
  const type = c.req.param("type");
  const publicId = c.req.param("publicId");

  if (type !== "thumb" && type !== "frame") return c.notFound();
  if (!PUBLIC_ID.test(publicId)) return c.text("Bad request", 400);

  const id = await findIdByPublicId(c.env, publicId);
  if (!id) return c.notFound();

  const bucket = type === "thumb" ? c.env.THUMBS : c.env.FRAMES;
  const object = await bucket.get(`${id}.webp`);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("content-type", "image/webp");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
});
