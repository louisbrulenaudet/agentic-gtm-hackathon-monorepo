import { createMiddleware } from "hono/factory";

/**
 * Unlock response headers for later middleware.
 *
 * Flue's Durable-Object-backed routes (`POST /workflows/:name?wait=result`,
 * `GET /runs/:runId`, agent prompt/stream routes) return passthrough `fetch()`
 * responses whose headers are immutable; any earlier-registered middleware that
 * sets a response header on the way out — `secureHeaders()` here — then throws
 * `TypeError: Can't modify immutable headers` and the request 500s.
 *
 * Re-wrapping preserves status/headers and passes the body stream by reference
 * (no buffering, SSE-safe), but yields mutable headers. Register it AFTER the
 * header-writing middleware: Hono runs after-phases in reverse registration
 * order, so this re-wrap happens before `secureHeaders()` writes. Status 101
 * (WebSocket upgrade) responses are left untouched — re-wrapping would drop the
 * socket.
 */
export const mutableResponse = createMiddleware(async (c, next) => {
  await next();
  if (c.res.status === 101) {
    return;
  }
  c.res = new Response(c.res.body, c.res);
});
