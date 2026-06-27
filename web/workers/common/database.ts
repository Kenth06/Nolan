import { drizzle } from "drizzle-orm/d1";
import * as schema from "../entities/frames.entity";

/** Drizzle ORM client bound to the D1 binding. All DB access goes through this (no raw SQL). */
export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}
