import { defineAgentProfile, type ToolDefinition } from "@flue/runtime";

import { Model } from "../../enums/model";
import { ThinkingLevel } from "../../enums/thinking-level";
import sillageSignals from "../../skills/sillage-signals/SKILL.md" with { type: "skill" };
import instructions from "./signal-scout.md" with { type: "markdown" };

/**
 * `signal_scout` — stage 2 specialist. Reconstructs the account from Sillage
 * (domain → company → org graph), pulls published signal detections, and
 * interprets each with the signal playbook (who to contact).
 *
 * The read-only Sillage MCP tools are connected once in the orchestrator's
 * factory and injected here, so authority (the `sk_live_` bearer) stays bound
 * in code, never model-supplied. When Sillage is unconfigured the tool list is
 * empty and the scout reports that it has no signal source rather than
 * inventing signals. Claude Sonnet 4.6 via AI Gateway handles the multi-call
 * MCP flow — enough reasoning for tool orchestration without Opus cost.
 */
export function createSignalScout(sillageTools: ToolDefinition[]) {
  return defineAgentProfile({
    name: "signal_scout",
    description:
      "Collects commercial signals and candidate decision-makers for one company from the connected Sillage workspace. Given a domain, resolves it to a Sillage company, reads the org graph, pulls signal detections, and interprets each with the playbook to say who to contact.",
    model: Model.CLAUDE_SONNET_4_6,
    instructions,
    thinkingLevel: ThinkingLevel.MEDIUM,
    tools: sillageTools,
    skills: [sillageSignals],
  });
}
