import { defineAgent, type AgentRouteHandler } from "@flue/runtime";

import { Model } from "../enums/model";
import { ThinkingLevel } from "../enums/thinking-level";
import { connectSillageReadTools } from "../mcp/sillage";
import prospectRanking from "../skills/prospect-ranking/SKILL.md" with { type: "skill" };
import instructions from "./orchestrator.md" with { type: "markdown" };
import { createContactEnricher } from "./subagents/contact-enricher";
import { createContentCollector } from "./subagents/content-collector";
import { createSignalScout } from "./subagents/signal-scout";
import { createTechstackProber } from "./subagents/techstack-prober";

export const description =
  "Agentic GTM orchestrator (Claude Opus 4.8): plans a prospect scan, delegates DNS tech-stack inference, Sillage signal scouting, and FullEnrich contact enrichment to per-domain specialists, then ranks accounts and writes vendor-tailored sales use cases.";

/**
 * Durable-submission bounds for the orchestrator.
 *
 * Flue defaults are `maxAttempts: 10` and `timeoutMs: 3_600_000` (1h). Each DO
 * reset or deploy that interrupts a running submission consumes an attempt and
 * re-runs the agent (paid Claude Opus 4.8 inference via AI Gateway), so we cap
 * retries far lower. `timeoutMs` is the wall-clock ceiling for a single run.
 */
const ORCHESTRATOR_DURABILITY = {
  maxAttempts: 3,
  timeoutMs: 10 * 60_000,
} as const;

/**
 * Route summarization to the cheapest available model. Compaction folds older
 * turns into a summary; doing that on a small model keeps token cost down
 * without changing the orchestrator's reasoning model. Token thresholds keep
 * Flue's model-aware defaults.
 */
const ORCHESTRATOR_COMPACTION = {
  model: Model.GEMMA_4_26B_A4B_IT,
} as const;

// Exposes POST/GET /agents/orchestrator/:id (used by the eval harness and
// conversational clients). Hackathon: no auth guard — the browser SPA calls
// this Worker directly behind a strict CORS allowlist (see app.ts).
export const route: AgentRouteHandler = async (_c, next) => next();

export default defineAgent<Env>(async () => {
  // Read-only Sillage MCP tools, bound once here with the workspace bearer and
  // handed to the signal_scout specialist that owns the integration. Empty when
  // SILLAGE_API_KEY is unset or the connection fails — the scout then reports
  // it has no signal source instead of breaking construction.
  const sillageTools = await connectSillageReadTools();

  const techstackProber = createTechstackProber();
  const signalScout = createSignalScout(sillageTools);
  const contactEnricher = createContactEnricher();
  const contentCollector = createContentCollector();

  return {
    model: Model.CLAUDE_OPUS_4_8,
    instructions,
    subagents: [
      techstackProber,
      signalScout,
      contactEnricher,
      contentCollector,
    ],
    skills: [prospectRanking],
    thinkingLevel: ThinkingLevel.MEDIUM,
    durability: ORCHESTRATOR_DURABILITY,
    compaction: ORCHESTRATOR_COMPACTION,
  };
});
