# worker-dns

A Cloudflare Worker that infers a company's tech stack from **public DNS records** — no API keys required. Given a domain, it resolves NS, MX, and TXT (including SPF `include:` mechanisms) over DNS-over-HTTPS and matches them against a data-driven fingerprint table for DNS/CDN, email, CRM, marketing automation, SSO/IdP, and analytics vendors.

Part of the [Agentic GTM](../../AGENTS.md#what-were-building--agentic-gtm-intelligence) engine — the `techstack_prober` integration point described in [worker-agent/AGENTS.md](../worker-agent/AGENTS.md).

**This Worker exposes no HTTP routes.** It is called exclusively over a Workers RPC service binding.

## Usage

From a caller Worker with a `worker-dns` service binding configured:

```ts
const analysis = await env.DNS_WORKER.analyzeDomain("example.com");
// {
//   domain: "example.com",
//   records: { ns: [...], mx: [{ exchange, priority }], txt: [...] },
//   spf: { raw: "v=spf1 ...", includes: [...] },
//   providers: [{ category, vendor, confidence, evidence: [...] }],
// }
```

See [AGENTS.md](./AGENTS.md) for the RPC contract, project layout, and how to extend the provider fingerprint table.

## Getting started

```sh
# From repo root
make install

pnpm --filter worker-dns dev     # wrangler dev — :8720
pnpm --filter worker-dns test    # unit tests
pnpm --filter worker-dns deploy  # wrangler deploy
```

## Project layout

```
src/
├── index.ts          WorkerEntrypoint — the exposed RPC surface
├── lib/               domain input normalization
└── services/          DoH client, record normalization, provider fingerprints + detection
```

See [AGENTS.md](./AGENTS.md) for the full guide and [../../AGENTS.md](../../AGENTS.md) for monorepo conventions.
