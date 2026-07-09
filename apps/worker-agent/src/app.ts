import { flue } from "@flue/runtime/routing";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";

import { idempotency } from "./middlewares/idempotency";
import { mutableResponse } from "./middlewares/mutable-response";
import { registerAnthropicGatewayProvider } from "./providers/anthropic-gateway";
import { registerCloudflareAiProvider } from "./providers/cloudflare-ai";
import { createRoutes } from "./routes";

// Workers AI (`cloudflare/…`) for the subagents + compaction; Anthropic via AI
// Gateway (`cloudflare-ai-gateway/…`) for the orchestrator's Claude Opus 4.8.
registerCloudflareAiProvider();
registerAnthropicGatewayProvider();

// Browser origins allowed to call this Worker cross-origin. The `front-app`
// SPA streams workflow-run events from here over SSE, so a strict, allowlisted
// CORS policy is required — the machine-to-machine default of no CORS blocks
// the browser. `WEB_APP_ORIGIN` is the deployed SPA origin; the localhost
// entries always cover `vite dev` (5174) and `vite preview` (4174).
const DEV_WEB_ORIGINS = ["http://localhost:5174", "http://localhost:4174"];

function allowedWebOrigins(): string[] {
  const configured = env.WEB_APP_ORIGIN;
  return configured ? [configured, ...DEV_WEB_ORIGINS] : DEV_WEB_ORIGINS;
}

const app = new Hono();

// CORS first so a preflight OPTIONS is answered before any other middleware.
// Credentials are off (this surface is keyless for the hackathon), so the
// wildcard `Access-Control-Expose-Headers: *` safely surfaces the
// Durable-Streams response headers the `@flue/sdk` stream client reads.
app.use(
  cors({
    origin: (origin) => (allowedWebOrigins().includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Idempotency-Key"],
    exposeHeaders: ["*"],
    maxAge: 600,
  }),
);

app.use(trimTrailingSlash());
// `crossOriginResourcePolicy: false` drops the default `same-origin` CORP so a
// cross-origin browser fetch/stream from the SPA can read the response body.
app.use(secureHeaders({ crossOriginResourcePolicy: false }));
// Must come after secureHeaders(): Flue's DO-backed routes return responses
// with immutable headers, which secureHeaders would otherwise throw on.
app.use(mutableResponse);

app.use(
  bodyLimit({
    maxSize: 256 * 1024,
    onError: (c) => c.json({ error: "Request body too large." }, 413),
  }),
);

// Hackathon: the AGENT_API_KEY guard has been removed from `/agents/*`,
// `/workflows/*` and `/runs/:runId` so the browser SPA can call this Worker
// directly (see also the `runs` export in workflows/sample-answer.ts).
// `middlewares/require-api-key.ts` is kept on disk — re-wire it before any
// non-hackathon deployment.

// Retry-safety for workflow invocations: a client resending the same
// `Idempotency-Key` gets the cached 2xx response instead of a second billed run.
app.post("/workflows/*", idempotency({ kv: env.IDEMPOTENCY_KV }));

app.route("/", createRoutes());
app.route("/", flue());

export default app;
