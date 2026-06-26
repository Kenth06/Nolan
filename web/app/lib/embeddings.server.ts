/**
 * Query embedding via Cloudflare AI Gateway -> Google AI Studio -> `gemini-embedding-2`.
 *
 * gemini-embedding-2 is multimodal: text and images map into ONE 1536-d space, so text->image
 * and image->image search share this single code path. The model auto-normalizes truncated
 * dimensions (1536), and Vectorize uses cosine, so no manual normalization is needed.
 *
 * One Content per request -> one vector (never aggregate multiple inputs into one).
 */

const MODEL = "gemini-embedding-2";
const OUTPUT_DIMS = 1536; // Vectorize index dimension; gemini caps at 3072.

export interface EmbedInput {
  /** Natural-language query (text->image search). */
  text?: string;
  /** Base64-encoded image bytes, no data-URL prefix (image->image search). */
  imageBase64?: string;
  /** MIME type of the image, e.g. "image/jpeg". */
  mime?: string;
}

export async function embedQuery(env: Env, input: EmbedInput): Promise<number[]> {
  if (!input.text && !input.imageBase64) {
    throw new Error("embedQuery: provide `text` or `imageBase64`");
  }
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY secret is not set (wrangler secret put / .dev.vars)");
  }

  // Build the gateway base URL from the AI binding so the account id isn't hardcoded:
  //   https://gateway.ai.cloudflare.com/v1/{account}/default/google-ai-studio
  const base = await env.AI.gateway("default").getUrl("google-ai-studio");

  const part = input.imageBase64
    ? { inlineData: { mimeType: input.mime ?? "image/jpeg", data: input.imageBase64 } }
    : { text: input.text };

  const res = await fetch(`${base}/v1beta/models/${MODEL}:embedContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [part] },
      outputDimensionality: OUTPUT_DIMS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini embed failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}
