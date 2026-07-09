import type { MiddlewareHandler } from "hono";
import { HttpHeader } from "@repo/enums-common/api/http-header";
import { env } from "cloudflare:workers";

import { timingSafeEqualStrings } from "../lib/timing-safe-equal";

function parseBearer(authorization: string | undefined): string | undefined {
  if (authorization === undefined) {
    return undefined;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match?.[1];
}

/**
 * Static API-key guard for the Flue surfaces (`/agents/*`, `/workflows/*`,
 * `/runs/:runId`) — the plain `MiddlewareHandler` shape from the Flue routing
 * guide.
 *
 * Every request must present the `AGENT_API_KEY` secret via either header:
 *
 * - `X-API-Key: <key>` — preferred; unambiguous.
 * - `Authorization: Bearer <key>` — for clients that can only set a single Bearer
 *   token (e.g. `@flue/sdk`'s `token` option, used by the eval harness).
 *
 * Comparison is constant-time. Anything else is `401`; a missing secret is
 * `503` (fail closed). Unit tests exercise this against a `cloudflare:workers`
 * stub aliased in `vitest.config.ts`.
 */
export const requireApiKey: MiddlewareHandler = async (c, next) => {
  const expected = env.AGENT_API_KEY;
  if (expected === undefined || expected === "") {
    return c.json(
      { error: "Service misconfigured: AGENT_API_KEY is not set." },
      503,
    );
  }

  const presented =
    c.req.header(HttpHeader.X_API_KEY) ??
    parseBearer(c.req.header(HttpHeader.AUTHORIZATION));

  if (
    presented === undefined ||
    presented === "" ||
    !timingSafeEqualStrings(presented, expected)
  ) {
    c.header("WWW-Authenticate", 'Bearer realm="worker-agent"');
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
};
