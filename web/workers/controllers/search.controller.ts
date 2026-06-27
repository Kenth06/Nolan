import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { searchSchema } from "../schemas/search.schema";
import { search } from "../services/search.service";
import type { HonoEnv } from "../common/types";
import type { SearchResultItem } from "../../app/lib/search.types";

export const searchController = new Hono<HonoEnv>();

/**
 * POST /api/search — text->image semantic search. Rate limited per client IP so the endpoint
 * (and the paid Gemini embedding behind it) can't be spammed.
 */
searchController.post(
  "/api/search",
  zValidator("json", searchSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? "Invalid request." }, 400);
    }
  }),
  async (c) => {
    const ip = c.req.header("cf-connecting-ip") ?? "anon";
    const { success } = await c.env.SEARCH_LIMITER.limit({ key: ip });
    if (!success) {
      return c.json({ error: "Too many searches — please wait a moment." }, 429);
    }

    const { q } = c.req.valid("json");
    const hits = await search(c.env, q);
    const results: SearchResultItem[] = hits.map((h) => ({
      ...h,
      thumbUrl: `/img/thumb/${h.id}`,
      frameUrl: `/img/frame/${h.id}`,
    }));
    return c.json({ results });
  },
);
