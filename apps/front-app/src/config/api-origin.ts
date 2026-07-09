// Default origins of the `worker-agent` Flue Worker (workflows, runs, agents),
// per build mode. These are the baked-in fallbacks used when
// `VITE_API_BASE_URL` is not set, so `make dev` and `make deploy` both target
// the right backend from any machine or CI with no `.env` file required.
//
// This module is intentionally dependency-free (plain string constants, no
// `import.meta`) so it can be imported from BOTH the browser bundle
// (`src/config/env.ts`) and the Node-side build config (`vite.config.ts`,
// which reads it for the build guard and the generated CSP `connect-src`).
//
// Setting `VITE_API_BASE_URL` (shell env, `.env.local`, `.env.production.local`)
// still overrides these — but do NOT put it in `.env`, which loads in every
// mode and would leak one environment's origin into the other.

/** Local `flue dev` server (see `apps/worker-agent` `dev` script `--port`). */
export const DEV_API_BASE_URL = "http://localhost:8788";

/** Deployed `worker-agent` Worker origin used by production builds. */
export const PROD_API_BASE_URL = "https://worker-agent.leo-sandbox.workers.dev";
