import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Check wrangler.jsonc and create the D1 database before using the app."
    );
  }

  return drizzle(env.DB, { schema });
}
