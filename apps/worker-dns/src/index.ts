import { WorkerEntrypoint } from "cloudflare:workers";

import type { DnsAnalysisResponse } from "@repo/dtos-common/rpc";
import { DnsAnalysisRequestSchema } from "@repo/dtos-common/rpc";

import { analyzeDomain } from "./services/analyze-domain";

/**
 * RPC surface: callers bind to this Worker via a `services` entry in their own
 * `wrangler.jsonc` and call `env.DNS_WORKER.analyzeDomain(domain)`. HTTP
 * requests are rejected — this Worker is not exposed on the public internet.
 */
export default class extends WorkerEntrypoint<Env> {
  fetch(): Response {
    return new Response(null, { status: 404 });
  }

  async analyzeDomain(domain: string): Promise<DnsAnalysisResponse> {
    const request = DnsAnalysisRequestSchema.parse({ domain });
    return analyzeDomain(request.domain);
  }
}
