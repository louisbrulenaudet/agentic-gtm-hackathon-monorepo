import type { ContentfulStatusCode } from "hono/utils/http-status";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import {
  idempotency,
  type IdempotencyStore,
} from "../src/middlewares/idempotency";

/** Map-backed in-memory fake satisfying the middleware's KV surface. */
function fakeStore(): IdempotencyStore & { size: () => number } {
  const entries = new Map<string, string>();
  return {
    get: <T>(key: string): Promise<T | null> => {
      const value = entries.get(key);
      if (value === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve(JSON.parse(value) as T);
    },
    put: (key: string, value: string): Promise<void> => {
      entries.set(key, value);
      return Promise.resolve();
    },
    size: () => entries.size,
  };
}

function buildApp(kv: IdempotencyStore, status: ContentfulStatusCode = 200) {
  let calls = 0;
  const app = new Hono();
  app.post("/workflows/*", idempotency({ kv }));
  app.post("/workflows/sample-answer", (c) => {
    calls += 1;
    return c.json({ call: calls }, status);
  });
  return { app, calls: () => calls };
}

function post(key?: string): RequestInit {
  return {
    method: "POST",
    headers: key === undefined ? {} : { "Idempotency-Key": key },
  };
}

describe("idempotency", () => {
  it("replays the cached 2xx response for the same key", async () => {
    const { app, calls } = buildApp(fakeStore());

    const first = await app.request("/workflows/sample-answer", post("k-1"));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ call: 1 });

    const second = await app.request("/workflows/sample-answer", post("k-1"));
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ call: 1 });
    expect(second.headers.get("Idempotent-Replayed")).toBe("true");
    expect(calls()).toBe(1);
  });

  it("executes again for a different key", async () => {
    const { app, calls } = buildApp(fakeStore());
    await app.request("/workflows/sample-answer", post("k-1"));
    const res = await app.request("/workflows/sample-answer", post("k-2"));
    expect(await res.json()).toEqual({ call: 2 });
    expect(calls()).toBe(2);
  });

  it("passes through when no header is present", async () => {
    const { app, calls } = buildApp(fakeStore());
    await app.request("/workflows/sample-answer", post());
    await app.request("/workflows/sample-answer", post());
    expect(calls()).toBe(2);
  });

  it("does not cache non-2xx responses", async () => {
    const store = fakeStore();
    const { app, calls } = buildApp(store, 502);
    await app.request("/workflows/sample-answer", post("k-1"));
    await app.request("/workflows/sample-answer", post("k-1"));
    expect(calls()).toBe(2);
    expect(store.size()).toBe(0);
  });

  it("ignores oversized keys", async () => {
    const store = fakeStore();
    const { app, calls } = buildApp(store);
    const huge = "x".repeat(300);
    await app.request("/workflows/sample-answer", post(huge));
    await app.request("/workflows/sample-answer", post(huge));
    expect(calls()).toBe(2);
    expect(store.size()).toBe(0);
  });
});
