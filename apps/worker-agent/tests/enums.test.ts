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
    // cloudflare-ai-gateway/... = Claude models via AI Gateway (orchestrator +
    //   specialist subagents), authenticated with CF_AIG_TOKEN.
    for (const model of MODELS) {
      expect(
        model.startsWith("cloudflare/") ||
          model.startsWith("cloudflare-ai-gateway/"),
      ).toBe(true);
    }
  });

  it("routes Claude models through AI Gateway, not direct Anthropic", () => {
    const gateway = MODELS.filter((model) =>
      model.startsWith("cloudflare-ai-gateway/"),
    );
    expect(gateway).toEqual([Model.CLAUDE_OPUS_4_8, Model.CLAUDE_SONNET_4_6]);
    expect(MODELS.some((model) => model.startsWith("anthropic/"))).toBe(false);
  });

  it("reserves Opus for the orchestrator and Sonnet for specialist subagents", () => {
    expect(DEFAULT_MODEL).toBe(Model.CLAUDE_OPUS_4_8);
    expect(Model.CLAUDE_SONNET_4_6).toBe(
      "cloudflare-ai-gateway/claude-sonnet-4-6",
    );
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
