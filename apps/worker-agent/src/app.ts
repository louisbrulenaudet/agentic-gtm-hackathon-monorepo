import { flue } from "@flue/runtime/routing";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";

import { idempotency } from "./middlewares/idempotency";
import { mutableResponse } from "./middlewares/mutable-response";
import { requireApiKey } from "./middlewares/require-api-key";
import { registerCloudflareAiProvider } from "./providers/cloudflare-ai";
import { createRoutes } from "./routes";

registerCloudflareAiProvider();

const app = new Hono();

app.use(trimTrailingSlash());
app.use(secureHeaders());
// Must come after secureHeaders(): Flue's DO-backed routes return responses
// with immutable headers, which secureHeaders would otherwise throw on.
app.use(mutableResponse);

// No CORS middleware on purpose: every consumer is machine-to-machine
// (@flue/sdk, curl, server-side callers). Without permissive CORS headers,
// browsers cannot make cross-origin calls to this API — the safer default now
// that endpoints carry an API key. Add a strict, allowlisted `hono/cors`
// config only when a browser client exists.

app.use(
  bodyLimit({
    maxSize: 256 * 1024,
    onError: (c) => c.json({ error: "Request body too large." }, 413),
  }),
);

// Auth boundary: every Flue surface requires AGENT_API_KEY. `/` and `/health`
// stay public for monitoring. `/runs/:runId` is guarded by the sample-answer
// workflow's `runs` export (the documented per-workflow exposure point), which
// reuses the same shared guard.
app.use("/agents/*", requireApiKey);
app.use("/workflows/*", requireApiKey);

// Retry-safety for workflow invocations: a client resending the same
// `Idempotency-Key` gets the cached 2xx response instead of a second billed
// run. Registered after auth so unauthenticated probes never touch KV.
app.post("/workflows/*", idempotency({ kv: env.IDEMPOTENCY_KV }));

app.route("/", createRoutes());
app.route("/", flue());

export default app;
