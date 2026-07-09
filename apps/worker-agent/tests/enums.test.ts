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

  it("namespaces every model under a Cloudflare provider", () => {
    // Workers AI models resolve through the `cloudflare` binding provider;
    // Claude models route through the `cloudflare-ai-gateway` catalog provider
    // (Anthropic upstream via AI Gateway).
    for (const model of MODELS) {
      expect(
        model.startsWith("cloudflare/") ||
          model.startsWith("cloudflare-ai-gateway/"),
      ).toBe(true);
    }
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
