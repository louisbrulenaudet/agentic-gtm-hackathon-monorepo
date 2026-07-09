import { defineAgentProfile } from "@flue/runtime";

import { Model } from "../../enums/model";
import { ThinkingLevel } from "../../enums/thinking-level";
import contactEnrichment from "../../skills/contact-enrichment/SKILL.md" with { type: "skill" };
import { enrichContact } from "../../tools/full-enrich";
import instructions from "./contact-enricher.md" with { type: "markdown" };

export function createContactEnricher() {
  return defineAgentProfile({
    name: "contact_enricher",
    description:
      "Enriches one named decision-maker with a professional email and phone number via FullEnrich. Given a name and a company (domain/name) or LinkedIn URL, returns email/phone or reports that none was found.",
    model: Model.CLAUDE_SONNET_4_6,
    instructions,
    thinkingLevel: ThinkingLevel.LOW,
    tools: [enrichContact],
    skills: [contactEnrichment],
  });
}
