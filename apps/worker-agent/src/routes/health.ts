import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/health", (c) => c.json({ status: "ok" }));

healthRoutes.get("/", (c) =>
  c.json({
    service: "worker-agent",
    agent: "orchestrator",
    auth: "none (hackathon) — CORS-allowlisted to the front-app SPA origin",
    endpoints: {
      answer: "POST /workflows/sample-answer?wait=result",
      prompt: "POST /agents/orchestrator/:id",
      promptSync: "POST /agents/orchestrator/:id?wait=result",
      stream: "GET /agents/orchestrator/:id",
      run: "GET /runs/:runId (metadata + SSE event stream)",
    },
  }),
);
