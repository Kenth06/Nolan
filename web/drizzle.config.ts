import { defineConfig } from "drizzle-kit";

// Generates plain SQLite migrations into ./migrations, which are applied to D1 via
// `wrangler d1 migrations apply`. No credentials needed for `generate`.
export default defineConfig({
  out: "./migrations",
  schema: "./workers/entities/frames.entity.ts",
  dialect: "sqlite",
});
