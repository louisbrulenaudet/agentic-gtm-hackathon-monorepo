import { expect } from "vitest";
import { describeEval, toolCalls } from "vitest-evals";

import { createFlueAgentHarness } from "./harness";

/**
 * Behavioral evals for the orchestrator agent.
 *
 * These are NOT part of `pnpm test` — they drive a real model. Run them against
 * a live app:
 *
 * Pnpm exec flue dev # terminal 1 (with provider creds configured) pnpm run
 * evals # terminal 2
 *
 * Or against a deployment: `FLUE_BASE_URL=https://… pnpm run evals`.
 *
 * `/agents/*` requires the Worker's API key: export `AGENT_API_KEY=<key>`
 * (matching the target's secret / `.dev.vars`) so the harness can send it as a
 * Bearer token.
 */
const harness = createFlueAgentHarness({ agentName: "orchestrator" });

describeEval("orchestrator agent", { harness }, (it) => {
  it("answers a lorem ipsum question and reports token usage", async ({
    run,
  }) => {
    const result = await run("Lorem ipsum dolor sit amet?");

    expect(result.output.trim().length).toBeGreaterThan(0);
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });

  it("does not hallucinate tool calls outside its toolset", async ({ run }) => {
    const result = await run(
      "Consectetur adipiscing elit sed do eiusmod tempor?",
    );

    for (const call of toolCalls(result)) {
      expect(call.name.length).toBeGreaterThan(0);
    }
    expect(result.output.trim().length).toBeGreaterThan(0);
  });
});
