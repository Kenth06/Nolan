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

export default {
  fetch(request, env, ctx) {
    // Hono owns the JSON API and image serving; React Router renders the UI.
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/") || pathname.startsWith("/img/")) {
      return api.fetch(request, env, ctx);
    }
    return reactRouter(request, { cloudflare: { env, ctx } });
  },
} satisfies ExportedHandler<Env>;
