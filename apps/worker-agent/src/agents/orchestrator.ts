import { defineAgent, type AgentRouteHandler } from "@flue/runtime";

import { Model } from "../enums/model";
import { ThinkingLevel } from "../enums/thinking-level";
import { connectSillageReadTools } from "../mcp/sillage";
import instructions from "./orchestrator.md" with { type: "markdown" };
import { createContactEnricher } from "./subagents/contact-enricher";
import { createContentCollector } from "./subagents/content-collector";

export const description =
  "Demo orchestrator: lorem ipsum dolor sit amet, delegates source collection to the content_collector subagent, contact enrichment to the contact_enricher subagent, and synthesizes a structured answer.";

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

// Exposes POST/GET /agents/orchestrator/:id (used by the eval harness
// and conversational clients). Auth is enforced app-wide by the AGENT_API_KEY
// guard on `/agents/*` in app.ts, so exposure stays a pass-through here.
export const route: AgentRouteHandler = async (_c, next) => next();

export default defineAgent<Env>(async () => {
  const contentCollector = createContentCollector();
  const contactEnricher = createContactEnricher();
  // Read-only Sillage MCP tools (empty when SILLAGE_API_KEY is unset or the
  // connection fails — the agent still runs without them).
  const sillageTools = await connectSillageReadTools();

  return {
    model: Model.CLAUDE_OPUS_4_8,
    instructions,
    subagents: [contentCollector, contactEnricher],
    tools: sillageTools,
    thinkingLevel: ThinkingLevel.MEDIUM,
    durability: ORCHESTRATOR_DURABILITY,
    compaction: ORCHESTRATOR_COMPACTION,
  };
});
