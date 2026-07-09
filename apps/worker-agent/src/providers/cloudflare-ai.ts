import { registerProvider } from "@flue/runtime";
import { env } from "cloudflare:workers";

let registered = false;

export function registerCloudflareAiProvider(): void {
  if (registered) {
    return;
  }

  registerProvider("cloudflare", {
    api: "cloudflare-ai-binding",
    binding: env.AI,
    gateway: {
      id: env.AI_GATEWAY_ID,
      collectLog: true,
    },
  });

  registered = true;
}
