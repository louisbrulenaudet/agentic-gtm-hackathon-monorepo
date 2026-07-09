import { WorkerEntrypoint } from "cloudflare:workers";

import type { DnsAnalysisResponse } from "@repo/dtos-common/rpc";
import { DnsAnalysisRequestSchema } from "@repo/dtos-common/rpc";

import { analyzeDomain } from "./services/analyze-domain";

/**
 * RPC-only surface (no `fetch` handler): callers bind to this Worker via a
 * `services` entry in their own `wrangler.jsonc` and call
 * `env.DNS_WORKER.analyzeDomain(domain)`.
 */
export default class extends WorkerEntrypoint<Env> {
  async analyzeDomain(domain: string): Promise<DnsAnalysisResponse> {
    const request = DnsAnalysisRequestSchema.parse({ domain });
    return analyzeDomain(request.domain);
  }
}
