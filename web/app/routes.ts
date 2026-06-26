import { type RouteConfig, index } from "@react-router/dev/routes";

// /api/* and /img/* are handled by the Hono app in workers/api.ts (see workers/app.ts).
export default [index("routes/home.tsx")] satisfies RouteConfig;
