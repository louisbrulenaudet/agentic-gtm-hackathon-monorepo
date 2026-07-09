export const Model = {
  KIMI_K2_6: "cloudflare/@cf/moonshotai/kimi-k2.6",
  GLM_5_2: "cloudflare/@cf/zai-org/glm-5.2",
  GEMMA_4_26B_A4B_IT: "cloudflare/@cf/google/gemma-4-26b-a4b-it",
} as const;

export const MODELS = [
  Model.KIMI_K2_6,
  Model.GLM_5_2,
  Model.GEMMA_4_26B_A4B_IT,
] as const;

export type Model = (typeof MODELS)[number];

/** Default orchestrator model. */
export const DEFAULT_MODEL: Model = Model.KIMI_K2_6;
