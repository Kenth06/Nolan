// Augments the wrangler-generated `Env` (worker-configuration.d.ts) with secrets,
// which are not declared in wrangler.jsonc.
interface Env {
  GEMINI_API_KEY: string;
}
