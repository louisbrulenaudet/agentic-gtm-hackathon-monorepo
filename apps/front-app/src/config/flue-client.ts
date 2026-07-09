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
 *
 * `fetch` is passed explicitly, bound to `globalThis`: the SDK stores it as an
 * instance field and calls it as a method (`this.fetchImpl(...)`), which strips
 * the `Window` receiver that the browser's native `fetch` requires and throws
 * `TypeError: Illegal invocation`. A pre-bound reference sidesteps that.
 */
export const flueClient: FlueClient = createFlueClient({
  baseUrl: apiBaseUrl,
  fetch: globalThis.fetch.bind(globalThis),
});
