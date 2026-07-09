import { describe, expect, it } from "vitest";

import {
  DEFAULT_MODEL,
  Model,
  MODELS,
  ThinkingLevel,
  THINKING_LEVELS,
} from "../src/enums";

describe("Model enum", () => {
  it("lists every Model value in MODELS", () => {
    expect(MODELS.toSorted()).toEqual(Object.values(Model).toSorted());
  });

  it("namespaces every model under a known Flue provider", () => {
    // cloudflare/...            = Workers AI binding (default, no API key).
    // cloudflare-ai-gateway/... = Claude Opus 4.8 for the orchestrator, via AI Gateway.
    // anthropic/...             = Flue's built-in Anthropic provider, direct —
    //   the one deliberate exception, scoped to contact_enricher only.
    // See .claude/rules/worker-agent.md.
    for (const model of MODELS) {
      expect(
        model.startsWith("cloudflare/") ||
          model.startsWith("cloudflare-ai-gateway/") ||
          model.startsWith("anthropic/"),
      ).toBe(true);
    }
  });

  it("scopes the direct-Anthropic exception to contact_enricher's model only", () => {
    const direct = MODELS.filter((model) => model.startsWith("anthropic/"));
    expect(direct).toEqual([Model.CLAUDE_HAIKU_4_5]);
  });

  it("defaults the orchestrator to a known model", () => {
    expect(MODELS).toContain(DEFAULT_MODEL);
  });
});

describe("ThinkingLevel enum", () => {
  it("lists every ThinkingLevel value in THINKING_LEVELS", () => {
    expect(THINKING_LEVELS.toSorted()).toEqual(
      Object.values(ThinkingLevel).toSorted(),
    );
  });
});
