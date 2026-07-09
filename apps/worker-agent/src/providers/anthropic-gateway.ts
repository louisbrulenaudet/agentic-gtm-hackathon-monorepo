import { registerProvider } from "@flue/runtime";
import { env } from "cloudflare:workers";

let registered = false;

/**
 * Register the `cloudflare-ai-gateway` provider so the orchestrator's Claude
 * Opus 4.8 calls route through Cloudflare AI Gateway to Anthropic (caching,
 * rate limiting, observability), instead of hitting Anthropic directly.
 *
 * Pi-ai's `cloudflare-ai-gateway` catalog supplies the model metadata (cost,
 * context window) and the Anthropic Messages wire protocol; we only override
 * the concrete gateway base URL (account + gateway id). The `apiKey` is sent as
 * the `cf-aig-authorization: Bearer <token>` header that authenticates to the
 * gateway — no Anthropic key leaves this Worker. AI Gateway supplies the
 * upstream Anthropic credentials itself via a stored provider key (BYOK) or
 * pays for inference with Unified Billing credits.
 */
export function registerAnthropicGatewayProvider(): void {
  if (registered) {
    return;
  }

  registerProvider("cloudflare-ai-gateway", {
    baseUrl: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/anthropic`,
    apiKey: env.CF_AIG_TOKEN,
  });

  registered = true;
}
