import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Drizzle ORM client bound to the D1 binding. All DB access goes through this (no raw SQL). */
export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}

export type DB = ReturnType<typeof getDb>;
export { schema };
