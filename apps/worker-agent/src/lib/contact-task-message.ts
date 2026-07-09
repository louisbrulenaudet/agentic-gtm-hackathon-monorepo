import type { ContactQuery } from "../dtos/contact-enrichment";

/**
 * Kept separate from `workflows/enrich-contacts.ts` so it can be unit tested
 * without importing the orchestrator's `.md` instructions module (which only
 * Flue's own build pipeline knows how to load — plain Vitest does not).
 */
export function buildContactTaskMessage(contact: ContactQuery): string {
  return `Enrich this contact using exactly these fields, never inventing a missing one: ${JSON.stringify(contact)}`;
}
