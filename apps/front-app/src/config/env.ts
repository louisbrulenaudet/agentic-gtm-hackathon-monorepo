import { DEV_API_BASE_URL, PROD_API_BASE_URL } from "@/config/api-origin";

// Origin of the `worker-agent` Flue Worker (workflows, runs, agents). Defaults
// are baked in per build mode (see `api-origin.ts`): the local `flue dev`
// server in dev, the deployed Worker in production — so `make dev` and
// `make deploy` both work with no `.env` file. `VITE_API_BASE_URL` overrides
// (shell env / `.env.local` / `.env.production.local`) for staging or a custom
// deployment; never set it in `.env`, which would apply to every mode.
const defaultApiBaseUrl = import.meta.env.DEV
  ? DEV_API_BASE_URL
  : PROD_API_BASE_URL;

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
