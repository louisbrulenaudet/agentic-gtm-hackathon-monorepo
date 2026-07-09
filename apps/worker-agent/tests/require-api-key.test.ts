import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { requireApiKey } from "../src/middlewares/require-api-key";
// Same module instance the middleware receives via the `cloudflare:workers`
// alias in vitest.config.ts — mutating it simulates the Worker's secrets.
import { env } from "./stubs/cloudflare-workers";

const SECRET = "test-secret-key";

function buildApp(): Hono {
  const app = new Hono();
  app.use("/protected/*", requireApiKey);
  app.get("/protected/resource", (c) => c.json({ ok: true }));
  return app;
}

describe("requireApiKey", () => {
  beforeEach(() => {
    env.AGENT_API_KEY = SECRET;
  });

  it("rejects requests without a credential", async () => {
    const res = await buildApp().request("/protected/resource");
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Bearer");
  });

  it("rejects a wrong X-API-Key", async () => {
    const res = await buildApp().request("/protected/resource", {
      headers: { "X-API-Key": "nope" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong Bearer token", async () => {
    const res = await buildApp().request("/protected/resource", {
      headers: { Authorization: "Bearer nope" },
    });
    expect(res.status).toBe(401);
  });

  it("accepts the key via X-API-Key", async () => {
    const res = await buildApp().request("/protected/resource", {
      headers: { "X-API-Key": SECRET },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("accepts the key via Authorization: Bearer", async () => {
    const res = await buildApp().request("/protected/resource", {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(res.status).toBe(200);
  });

  it("fails closed with 503 when the secret is unset", async () => {
    env.AGENT_API_KEY = undefined;
    const res = await buildApp().request("/protected/resource", {
      headers: { "X-API-Key": SECRET },
    });
    expect(res.status).toBe(503);
  });

  it("fails closed with 503 when the secret is empty", async () => {
    env.AGENT_API_KEY = "";
    const res = await buildApp().request("/protected/resource", {
      headers: { "X-API-Key": "" },
    });
    expect(res.status).toBe(503);
  });
});
