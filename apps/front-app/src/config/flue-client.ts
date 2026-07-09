import { createFlueClient, type FlueClient } from "@flue/sdk";
import { apiBaseUrl } from "@/config/env";

/**
 * Single shared browser client for the `worker-agent` Flue HTTP surface.
 *
 * `baseUrl` is the Worker origin where `flue()` is mounted (it serves
 * `/workflows/*`, `/runs/*` and `/agents/*`). No `token` is set: the hackathon
 * build dropped the API-key guard, so the browser calls the Worker directly
 * over a CORS-allowlisted origin. Used by the run-stream hook and the run
 * query-options — never construct a second client (it would not share state).
 */
export const flueClient: FlueClient = createFlueClient({ baseUrl: apiBaseUrl });
