import { defineAgentProfile } from "@flue/runtime";

import { Model } from "../../enums/model";
import { ThinkingLevel } from "../../enums/thinking-level";
import instructions from "./content-collector.md" with { type: "markdown" };

/**
 * Build the `content_collector` subagent profile.
 *
 * Built inside the orchestrator's agent factory (Durable Object context) so the
 * profile is created alongside the parent agent. See `orchestrator.ts`.
 */
export function createContentCollector() {
  return defineAgentProfile({
    name: "content_collector",
    description:
      "Lorem ipsum research specialist: returns sourced findings (references + excerpts) for a given brief. Does not answer the question directly.",
    model: Model.GEMMA_4_26B_A4B_IT,
    instructions,
    thinkingLevel: ThinkingLevel.MEDIUM,
  });
}
