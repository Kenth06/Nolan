import { Hono } from "hono";
import { CustomError } from "./common/error";
import type { HonoEnv } from "./common/types";
import { searchController } from "./controllers/search.controller";
import { imageController } from "./controllers/image.controller";

const api = new Hono<HonoEnv>();

// Known errors map to their status with a safe message; anything else is a generic 500 — internal
// detail (config state, upstream bodies) is logged, never returned to the client.
api.onError((err, c) => {
  if (err instanceof CustomError) {
    console.error(`[${err.code}]`, err.message);
    const message = err.status >= 500 ? "Search failed." : err.message;
    return c.json({ error: message }, err.status);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Search failed." }, 500);
});

api.route("/", searchController);
api.route("/", imageController);

export { api };
