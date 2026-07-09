import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { describe, expect, it } from "vitest";

import { mutableResponse } from "../src/middlewares/mutable-response";

describe("mutableResponse", () => {
  it("preserves status, headers, and body through the re-wrap", async () => {
    const app = new Hono();
    app.use(secureHeaders());
    app.use(mutableResponse);
    app.get("/resource", (c) => c.json({ ok: true }, 201));

    const res = await app.request("/resource");
    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(await res.json()).toEqual({ ok: true });
    // secureHeaders wrote onto the re-wrapped (mutable) response.
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("re-wraps into a response with mutable headers", async () => {
    const app = new Hono();
    app.use(mutableResponse);
    app.get("/resource", (c) => c.text("ok"));

    const res = await app.request("/resource");
    // Throws on immutable headers; passing means the guard was lifted.
    res.headers.set("X-Probe", "1");
    expect(res.headers.get("X-Probe")).toBe("1");
  });
});
