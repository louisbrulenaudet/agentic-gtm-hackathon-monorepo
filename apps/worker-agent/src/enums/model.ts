export const Model = {
  /**
   * Orchestrator model: Claude Opus 4.8 reached through Cloudflare AI Gateway
   * (Anthropic upstream). Resolved from pi-ai's `cloudflare-ai-gateway`
   * catalog; the gateway supplies the Anthropic credentials via a stored
   * provider key (BYOK) or Unified Billing credits — see
   * providers/anthropic-gateway.ts.
   */
  CLAUDE_OPUS_4_8: "cloudflare-ai-gateway/claude-opus-4-8",
  /**
   * Specialist-tier model for MCP-backed or lower-stakes subagents (Sillage
   * scouting, contact enrichment). Latest Sonnet in pi-ai's gateway catalog as
   * of @flue/runtime 1.0.0-beta.7 — there is no `claude-sonnet-5` entry yet.
   */
  CLAUDE_SONNET_4_6: "cloudflare-ai-gateway/claude-sonnet-4-6",
  KIMI_K2_6: "cloudflare/@cf/moonshotai/kimi-k2.6",
  GLM_5_2: "cloudflare/@cf/zai-org/glm-5.2",
  GEMMA_4_26B_A4B_IT: "cloudflare/@cf/google/gemma-4-26b-a4b-it",
} as const;

export const MODELS = [
  Model.CLAUDE_OPUS_4_8,
  Model.CLAUDE_SONNET_4_6,
  Model.KIMI_K2_6,
  Model.GLM_5_2,
  Model.GEMMA_4_26B_A4B_IT,
] as const;

export type Model = (typeof MODELS)[number];

/** Default orchestrator model. */
export const DEFAULT_MODEL: Model = Model.CLAUDE_OPUS_4_8;
