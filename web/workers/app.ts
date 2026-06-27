import { createRequestHandler } from "react-router";
import { api } from "./api";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const reactRouter = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

// Conservative, non-breaking hardening for HTML/document responses: block framing and content
// sniffing, trim the referrer. (No restrictive script/style CSP — that would risk SSR hydration.)
function harden(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("x-frame-options", "DENY");
  headers.set("content-security-policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    // Hono owns the JSON API and image serving; React Router renders the UI.
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/") || pathname.startsWith("/img/")) {
      return api.fetch(request, env, ctx);
    }
    return harden(await reactRouter(request, { cloudflare: { env, ctx } }));
  },
} satisfies ExportedHandler<Env>;
