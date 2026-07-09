@AGENTS.md

## Claude Code

- This Worker has no `fetch` handler by design — it is RPC-only (`WorkerEntrypoint`). Do not add HTTP routes without discussing scope first.
- Provider vendor patterns are data in `src/services/provider-fingerprints.ts` — add entries there, never inline substring checks elsewhere.
