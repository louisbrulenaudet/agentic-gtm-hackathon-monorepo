import { defineTool } from "@flue/runtime";
import { env } from "cloudflare:workers";

import type { EnrichedContact } from "../dtos/contact-enrichment";
import {
  ContactQuerySchema,
  EnrichedContactSchema,
} from "../dtos/contact-enrichment";
import {
  pollBulkEnrichmentUntilDone,
  submitBulkEnrichment,
  toMappedContact,
} from "../lib/full-enrich-client";

/**
 * Looks up one contact via FullEnrich (https://fullenrich.com). Credentials are
 * bound here from `env`, never accepted as a model-supplied argument (see
 * `.claude/skills/flue/reference/tools.md` — "Protect access").
 */
export const enrichContact = defineTool({
  name: "enrich_contact",
  description:
    "Look up a professional email address and phone number for one named contact via FullEnrich. Requires a first and last name, plus either a company domain/name or a LinkedIn URL.",
  input: ContactQuerySchema,
  output: EnrichedContactSchema,
  async run({ input, signal }) {
    const apiKey = env.FULLENRICH_API_KEY;
    if (!apiKey) {
      return notEnriched(
        input,
        "FullEnrich is not configured (FULLENRICH_API_KEY is unset).",
      );
    }

    const correlationId = crypto.randomUUID();

    try {
      const enrichmentId = await submitBulkEnrichment(
        [
          {
            firstname: input.firstName,
            lastname: input.lastName,
            domain: input.companyDomain,
            companyName: input.companyName,
            linkedinUrl: input.linkedinUrl,
            correlationId,
          },
        ],
        apiKey,
        signal,
      );

      const result = await pollBulkEnrichmentUntilDone(enrichmentId, apiKey, {
        signal,
      });
      const record =
        result.datas.find(
          (item) => item.custom?.correlationId === correlationId,
        ) ?? result.datas[0];

      if (record === undefined) {
        return notEnriched(
          input,
          "FullEnrich returned no result for this contact.",
        );
      }

      return { ...toMappedContact(record), error: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return notEnriched(input, `FullEnrich lookup failed: ${reason}`);
    }
  },
});

function notEnriched(
  input: { firstName: string; lastName: string },
  error: string,
): EnrichedContact {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: null,
    emailStatus: null,
    phone: null,
    found: false,
    error,
  };
}
