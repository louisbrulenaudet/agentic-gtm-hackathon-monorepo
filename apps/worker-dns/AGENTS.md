# Worker DNS Instructions

## Purpose

`worker-dns` infers a company's technical stack from **public DNS records alone** — no API keys, no crawling. It resolves NS, MX, and TXT (including SPF `include:` mechanisms) over DNS-over-HTTPS and matches them against a data-driven provider fingerprint table to surface the DNS/CDN, email, CRM, marketing automation, SSO/IdP, analytics, and other SaaS vendors a domain runs.

This is the `techstack_prober` integration point described in [../../AGENTS.md → What We're Building](../../AGENTS.md#what-were-building--agentic-gtm-intelligence). `worker-agent`'s `techstack_prober` sub-agent is the intended caller — wiring that service binding is a separate change.

- **Dev:** `http://localhost:8720` (RPC only — there is no HTTP route to hit with a browser or curl).
- **Auth:** none. The DNS-over-HTTPS resolver is key-less; the RPC surface itself has no inbound auth because it is only reachable from other Workers over a service binding, never from the public internet.
- **Runtime:** Cloudflare Workers, no bindings, no storage.

## RPC surface

Exposed via `WorkerEntrypoint` (Cloudflare Workers RPC — [docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/)), **not** HTTP. A caller Worker declares a service binding:

```jsonc
// caller's wrangler.jsonc
{
  "services": [{ "binding": "DNS_WORKER", "service": "worker-dns" }],
}
```

and calls it:

```ts
const analysis = await env.DNS_WORKER.analyzeDomain("example.com");
```

| Method | Input | Output |
|--------|-------|--------|
| `analyzeDomain(domain: string)` | any messy domain-ish string (URL, bare domain, with/without scheme) | `DnsAnalysisResponse` (`@repo/dtos-common/rpc`) |

Request/response shapes are validated with Zod (`DnsAnalysisRequestSchema` / `DnsAnalysisResponseSchema`) at the RPC boundary — see [packages/dtos-common/src/rpc/dns-analysis.ts](../../packages/dtos-common/src/rpc/dns-analysis.ts).

## Structure

```
apps/worker-dns/src/
├── index.ts              # WorkerEntrypoint — the ONLY exposed surface, delegates immediately
├── lib/
│   └── normalize-domain.ts   # messy input -> canonical lowercase hostname
└── services/
    ├── dns-client.ts          # DNS-over-HTTPS (Cloudflare 1.1.1.1 JSON API) for NS/MX/TXT
    ├── dns-normalizer.ts      # raw DoH answers -> normalized NS/MX/TXT + SPF includes
    ├── provider-fingerprints.ts # data-driven vendor pattern table (extend here)
    ├── provider-detector.ts   # matches normalized records against fingerprints -> detections
    └── analyze-domain.ts      # orchestrates the full pipeline, validates the final response
```

## Where to change things

| Task | Location |
|------|----------|
| Add/adjust a vendor fingerprint | `src/services/provider-fingerprints.ts` — append an entry, no other code changes needed |
| New detection category | `@repo/enums-common` `ProviderCategory` first (second-consumer rule already met: it's referenced by the shared `dns-analysis` schema) |
| Domain input parsing rules | `src/lib/normalize-domain.ts` |
| DNS record parsing (NS/MX/TXT/SPF) | `src/services/dns-normalizer.ts` |
| RPC request/response contract | `packages/dtos-common/src/rpc/dns-analysis.ts` |
| RPC method surface | `src/index.ts` — keep it a thin delegator, no business logic here |

## Conventions

- Kebab-case filenames; functions ≤ 100 lines; no `any`.
- No HTTP endpoints by design — do not add a `fetch` handler. If a future need requires one (e.g. a health check), justify it explicitly; the default is RPC-only.
- Provider detection is data-driven: never hardcode a one-off vendor check inside `provider-detector.ts` — add a fingerprint entry instead.
- Matching differs by source: `ns` / `mxExchange` / `spfInclude` patterns are hostnames matched on a DNS label boundary (`hostMatches` in `provider-detector.ts` — pattern `cloudflare.com` matches `ns1.cloudflare.com`, not `notcloudflare.com`); `txt` patterns are plain substrings of a domain-verification value (they aren't hostnames).
- Only add a fingerprint you can verify against the vendor's own documentation — an unverifiable guess is worse than no entry. If a vendor's only real signal lives on a dedicated DNS sub-label (e.g. `_stripe-verification.<domain>`), it cannot be detected by this pipeline (single apex TXT query only) — do not add a fingerprint for it; see the exclusion list at the top of `provider-fingerprints.ts`.
- Prefer `ConfidenceLevel.HIGH` only for patterns effectively unique to one vendor (e.g. a named domain-verification token), `MEDIUM` when the pattern is shared infra, regional, or a less common path.
- `src/index.ts` only validates the request and calls `services/analyze-domain.ts` — do not grow it.

## Commands

```bash
pnpm --filter worker-dns dev      # wrangler dev — :8720 (RPC only, no browsable routes)
pnpm --filter worker-dns test     # unit tests
pnpm --filter worker-dns types    # worker-configuration.d.ts
pnpm --filter worker-dns deploy   # wrangler deploy
pnpm --filter worker-dns ci       # lint + format + check-types
```

## Contribution

Follow this file and root [AGENTS.md](../../AGENTS.md). Run `make ci` before opening a PR. Update this file when adding a fingerprint category, a new RPC method, or a binding.
