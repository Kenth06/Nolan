/**
 * Query embedding via Cloudflare AI Gateway -> Google AI Studio -> `gemini-embedding-2`.
 *
 * gemini-embedding-2 is multimodal: text and the indexed images map into ONE 1536-d space, so a
 * typed query finds the frames it looks like. The model auto-normalizes truncated dimensions
 * (1536) and Vectorize uses cosine, so no manual normalization is needed. One Content per request
 * -> one vector.
 */

import { CustomError } from "../common/error";

const MODEL = "gemini-embedding-2";
const OUTPUT_DIMS = 1536; // Vectorize index dimension; gemini caps at 3072.

// The gateway base URL is invariant for the isolate's lifetime, so resolve it once. Building it
// from the AI binding keeps the account id out of the source.
//   https://gateway.ai.cloudflare.com/v1/{account}/default/google-ai-studio
let gatewayBase: Promise<string> | undefined;
function getGatewayBase(env: Env): Promise<string> {
  return (gatewayBase ??= env.AI.gateway("default").getUrl("google-ai-studio"));
}

export async function embedQuery(env: Env, text: string): Promise<number[]> {
  if (!env.GEMINI_API_KEY) {
    throw new CustomError("Embedding key not configured", 500, "ERR_EMBED_CONFIG");
  }

  const base = await getGatewayBase(env);
  const res = await fetch(`${base}/v1beta/models/${MODEL}:embedContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: OUTPUT_DIMS,
    }),
  });

  if (!res.ok) {
    throw new CustomError(`Gemini embed failed (${res.status}): ${await res.text()}`, 502, "ERR_EMBED_UPSTREAM");
  }
  const data = (await res.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}
