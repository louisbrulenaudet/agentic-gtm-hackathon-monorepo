/**
 * Vitest stand-in for the `cloudflare:workers` module, wired up as a resolve
 * alias in `vitest.config.ts`. Unit tests run under plain Node, where the real
 * module only exists inside the Workers runtime. Tests import this file
 * directly (same resolved module instance as the alias) and mutate `env` to
 * simulate bindings and secrets.
 */
export const env: { AGENT_API_KEY?: string | undefined } = {};
