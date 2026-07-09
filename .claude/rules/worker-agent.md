---
paths:
  - "apps/**/src/agents/**"
  - "apps/**/src/workflows/**"
---

# Agent Worker (Flue) Rules

`apps/worker-agent` is a Cloudflare Worker built on the **Flue** framework (`@flue/runtime`, `@flue/sdk`, `@flue/cli`) plus the `agents` SDK. For the framework itself, load the `flue` skill.

## Build & deploy (do not confuse source vs generated)

- `wrangler.jsonc` is the **source** config. `flue build --target cloudflare` reads it and writes the deployable **`dist/worker_agent/wrangler.json`** — deploy that generated file, **never** the source. The generated manifest and everything under `dist/**` are outputs: never hand-edit them (see [guardrails.md](guardrails.md)); change the source and rebuild.
- Durable Objects and the Worker entrypoint are **injected by `flue build`** from `src/agents/**` and `src/workflows/**`. When you add an agent or workflow that needs a DO, **append a new migration tag** (never rewrite or renumber an existing one): `FlueOrchestratorAgent` is `v1`, `FlueSampleAnswerWorkflow` is `v2`. Subagents create no DO.

## Validation

- Flue's workflow/agent **`input` / `output` schema slots are valibot**-typed. Use valibot only inside those slots; every other schema in this app (events, query DTOs) stays on **Zod 4**. See [contracts.md](contracts.md).

## Auth (hackathon: currently disabled)

- **Current state:** the `AGENT_API_KEY` guard has been **removed** from `/agents/*`, `/workflows/*` and `/runs/:runId` so the browser SPA (`front-app`) can call this Worker directly, and a strict `hono/cors` allowlist (`WEB_APP_ORIGIN` + localhost) was added. `/` and `/health` remain public.
- **To restore fail-closed auth** (any non-hackathon deployment): re-wire `middlewares/require-api-key.ts` in `app.ts` (on `/agents/*`, `/workflows/*`) and set the workflow `runs` export back to it — timing-safe compare, `X-API-Key` or `Authorization: Bearer`, **503** when the secret is unset. Never default to permissive; do not roll new auth. Keep CORS strict and allowlisted whenever a browser client exists.

## Inference & observability

- Three providers are in play:
  - **Workers AI** (`cloudflare/…`) — `techstack_prober` + compaction — via the `AI` binding (`providers/cloudflare-ai.ts`); no external key.
  - **Claude Opus 4.8** (`cloudflare-ai-gateway/…`) — the orchestrator only — via the gateway's Anthropic endpoint (`providers/anthropic-gateway.ts`). Auth is `CF_AIG_TOKEN`.
  - **Claude Sonnet 4.6** (`cloudflare-ai-gateway/…`) — MCP-backed or lower-stakes specialists (`signal_scout`, `contact_enricher`) — same `CF_AIG_TOKEN` gateway path. No `claude-sonnet-5` in pi-ai's catalog yet.

## Where things go

| Task | Location |
| --- | --- |
| Add/edit an agent or subagent | `src/agents/**` (`defineAgent` / `defineAgentProfile` + the matching `.md` prompt) |
| Add/edit a workflow | `src/workflows/**` (`defineWorkflow` + `.md` brief; export `route`/`runs`, append a DO migration) |
| Add/edit a tool (external API/DB call) | `src/tools/**` (`defineTool`, valibot `parameters`); bind credentials in code, never as a model-supplied argument |
| MCP client | `src/mcp/` (e.g. `sillage.ts`) |
| Change routes / middleware | `src/routes/**`, `src/middlewares/**`, `src/app.ts` |
| Change AI provider / models | `src/providers/cloudflare-ai.ts`, `src/providers/anthropic-gateway.ts` + `src/enums/model.ts` |

Verify with `pnpm --filter <worker-name> run check-types` and `pnpm --filter <worker-name> test`. See [testing.md](testing.md) for evals.
