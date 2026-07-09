import { ContentType } from "@repo/enums-common/api/content-type";
import { HttpHeader } from "@repo/enums-common/api/http-header";
import { createMiddleware } from "hono/factory";

/**
 * The minimal KV surface the middleware needs. `env.IDEMPOTENCY_KV` satisfies
 * it structurally; tests supply a Map-backed fake without casting.
 */
export interface IdempotencyStore {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface IdempotencyOptions {
  kv?: IdempotencyStore;
  header?: string;
  prefix?: string;
  ttlSeconds?: number;
  maxKeyLength?: number;
}

interface CachedResponse {
  status: number;
  body: string;
  contentType: string;
}

const DEFAULTS = {
  header: HttpHeader.IDEMPOTENCY_KEY,
  prefix: "idem:",
  ttlSeconds: 60 * 60 * 24,
  maxKeyLength: 200,
} as const satisfies Required<Omit<IdempotencyOptions, "kv">>;

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Idempotency middleware.
 *
 * Deduplication is opt-in via the key, not automatic. The same request sent
 * twice is deduplicated _only_ when both calls carry the _same_
 * `Idempotency-Key` against the same path. Without the header (or with a
 * different value each time) every call falls through to the handler and
 * dispatches a separate, billed run — Workers AI inference — even if the
 * request body is byte-for-byte identical. This middleware does not fingerprint
 * the body; clients that want retry-safety MUST generate one stable key per
 * logical operation and resend it on every retry of that operation.
 */
export function idempotency(options: IdempotencyOptions = {}) {
  const { kv, header, prefix, ttlSeconds, maxKeyLength } = {
    ...DEFAULTS,
    ...options,
  };

  return createMiddleware(async (c, next) => {
    const raw = c.req.header(header)?.trim();
    // Scope by path so the same client key cannot collide across endpoints.
    const key =
      raw && raw.length <= maxKeyLength
        ? `${prefix}${c.req.path}:${raw}`
        : undefined;

    if (!kv || !key) {
      await next();
      return;
    }

    const cached = await kv.get<CachedResponse>(key, "json");
    if (cached) {
      c.res = new Response(cached.body, {
        status: cached.status,
        headers: {
          [HttpHeader.CONTENT_TYPE]: cached.contentType,
          "Idempotent-Replayed": "true",
        },
      });
      return;
    }

    await next();

    if (!isSuccess(c.res.status)) {
      return;
    }

    const snapshot: CachedResponse = {
      status: c.res.status,
      body: await c.res.clone().text(),
      contentType:
        c.res.headers.get(HttpHeader.CONTENT_TYPE) ?? ContentType.JSON,
    };
    const write = kv
      .put(key, JSON.stringify(snapshot), { expirationTtl: ttlSeconds })
      .catch(() => {});
    try {
      c.executionCtx.waitUntil(write);
    } catch {
      // No execution context (unit tests) — the write stays best-effort.
    }
  });
}
