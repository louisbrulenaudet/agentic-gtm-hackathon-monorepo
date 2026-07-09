import type { DnsAnalysisResponse } from "@repo/dtos-common/rpc";

/**
 * `wrangler types` only knows `DNS_WORKER` is a service binding, not the RPC
 * entrypoint's method signature — it generates a bare `Fetcher`. Intersect with
 * the RPC contract documented in apps/worker-dns/AGENTS.md so
 * `env.DNS_WORKER.analyzeDomain(...)` is typed without a cast, while staying
 * assignable to the generated `Fetcher` type (no merge conflict).
 */
declare global {
  interface Env {
    DNS_WORKER: Fetcher & {
      analyzeDomain(domain: string): Promise<DnsAnalysisResponse>;
    };
  }
}
