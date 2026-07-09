// Origin of the `worker-agent` Flue Worker (workflows, runs, agents). In dev
// it is the local `flue dev` server on :8788; in production set
// `VITE_API_BASE_URL` to the deployed Worker origin (the build guard in
// vite.config.ts fails a production build when it is missing).
const defaultApiBaseUrl = import.meta.env.DEV ? "http://localhost:8788" : "";

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
