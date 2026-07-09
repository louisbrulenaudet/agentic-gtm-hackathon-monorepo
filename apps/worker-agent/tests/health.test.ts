import { describe, expect, it } from "vitest";

import { healthRoutes } from "../src/routes/health";

describe("health routes", () => {
  it("GET /health returns ok", async () => {
    const res = await healthRoutes.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("GET / returns the service descriptor", async () => {
    const res = await healthRoutes.request("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      service: "worker-agent",
      agent: "orchestrator",
      endpoints: { prompt: "POST /agents/orchestrator/:id" },
    });
  });

  it("returns 404 for an unknown path", async () => {
    const res = await healthRoutes.request("/nope");
    expect(res.status).toBe(404);
  });
});
