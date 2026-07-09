import type {
  DecisionMaker,
  EnrichedContact,
  GtmSignal,
  ProspectRanking,
  ProspectScanInput,
  ProspectScanOutput,
  ProspectSynthesis,
  RankedProspect,
  TechFingerprint,
} from "../dtos";

/**
 * Cap on decision-makers enriched per domain. FullEnrich is billed per lookup,
 * so we enrich only the top candidates `signal_scout` surfaced rather than the
 * whole org graph.
 */
export const MAX_ENRICH_PER_DOMAIN = 5;

/** Max length for signal text fields embedded in ranking prompts. */
export const MAX_SIGNAL_FIELD_LENGTH = 400;

/**
 * Per-domain evidence bundle assembled by the workflow before the orchestrator
 * ranks it. App-local assembly shape (not a wire contract), so it is a plain
 * type over the inferred DTO types rather than its own schema.
 */
export type DomainDossier = {
  domain: string;
  companyName: string | null;
  fingerprint: TechFingerprint;
  signals: GtmSignal[];
  decisionMakers: DecisionMaker[];
};

/** Decision-maker row with null contact fields omitted for smaller prompts. */
export type CompactDecisionMaker = {
  firstName: string;
  lastName: string;
  contactFound: boolean;
  title?: string;
  seniority?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
};

/** Trimmed dossier payload for per-domain ranking prompts. */
export type CompactDomainDossier = {
  domain: string;
  companyName: string | null;
  fingerprint: TechFingerprint;
  signals: GtmSignal[];
  decisionMakers: CompactDecisionMaker[];
};

/** Brief for `techstack_prober`: one domain, fingerprint back. */
export function buildTechBrief(domain: string): string {
  return `Fingerprint the technical stack for the domain "${domain}" from its public DNS. Return the tech-stack fingerprint object.`;
}

/** Brief for `signal_scout`: one domain + who is selling, signals back. */
export function buildScoutBrief(domain: string, vendorPersona: string): string {
  return [
    `Scout commercial signals and decision-makers for the domain "${domain}".`,
    `The vendor running this scan: ${vendorPersona}.`,
    "Resolve the domain in Sillage, pull the signals tied to this account, interpret each with the playbook, and surface the decision-makers who match the persona. Return the structured findings.",
  ].join("\n");
}

/** Brief for `contact_enricher`: one decision-maker, email/phone back. */
export function buildEnrichBrief(
  person: DecisionMaker,
  domain: string,
): string {
  const linkedin =
    person.linkedinUrl !== null ? ` LinkedIn: ${person.linkedinUrl}.` : "";
  return `Enrich this decision-maker with a professional email and phone number. Name: ${person.firstName} ${person.lastName}. Company domain: ${domain}.${linkedin} Return the enrichment record.`;
}

/**
 * Fold a FullEnrich result back onto the decision-maker the scout surfaced.
 * Enrichment only fills contact fields; identity stays as the scout reported.
 */
export function mergeContact(
  person: DecisionMaker,
  enriched: EnrichedContact,
): DecisionMaker {
  return {
    ...person,
    email: enriched.email,
    phone: enriched.phone,
    contactFound: enriched.found,
  };
}

function truncateField(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function compactDecisionMaker(person: DecisionMaker): CompactDecisionMaker {
  const compact: CompactDecisionMaker = {
    firstName: person.firstName,
    lastName: person.lastName,
    contactFound: person.contactFound,
  };
  if (person.title !== null) {
    compact.title = person.title;
  }
  if (person.seniority !== null) {
    compact.seniority = person.seniority;
  }
  if (person.linkedinUrl !== null) {
    compact.linkedinUrl = person.linkedinUrl;
  }
  if (person.email !== null) {
    compact.email = person.email;
  }
  if (person.phone !== null) {
    compact.phone = person.phone;
  }
  return compact;
}

/**
 * Trim a dossier before embedding it in a ranking prompt — omit null contact
 * fields and cap long signal text so each per-domain stream stays small.
 */
export function compactDossierForRanking(
  dossier: DomainDossier,
): CompactDomainDossier {
  return {
    domain: dossier.domain,
    companyName: dossier.companyName,
    fingerprint: dossier.fingerprint,
    signals: dossier.signals.map((signal) => ({
      ...signal,
      summary: truncateField(signal.summary, MAX_SIGNAL_FIELD_LENGTH),
      whoToContact: truncateField(signal.whoToContact, MAX_SIGNAL_FIELD_LENGTH),
    })),
    decisionMakers: dossier.decisionMakers.map(compactDecisionMaker),
  };
}

/**
 * Per-domain ranking prompt: one account's evidence, one `ProspectRanking`
 * back. Sharding synthesis this way keeps each Opus structured-output stream
 * short enough to finish (a single batch prompt was cut off by AI Gateway with
 * "Stream ended without finish_reason").
 */
export function buildPerDomainRankingBrief(
  input: ProspectScanInput,
  dossier: DomainDossier,
): string {
  const vendor = input.vendorName ?? "the vendor";
  const compact = compactDossierForRanking(dossier);
  return [
    `Rank this single account for ${vendor}.`,
    `Vendor persona: ${input.vendorPersona}.`,
    `Account domain: ${dossier.domain}.`,
    "",
    "Evidence (fingerprint, signals, decision-makers) as JSON:",
    "```json",
    JSON.stringify(compact),
    "```",
    "",
    "Using the prospect-ranking skill, score this account 0-100 on fit, timing, and reachability; assign a tier; and write 1-3 tailored sales use cases grounded in the evidence. Ground everything in the dossier — never invent a signal, vendor, person, or contact.",
    "",
    "Return judgment only: `domain` (echo the account domain), `opportunityScore`, `tier`, `salesUseCases`, `rationale`. Do NOT repeat the fingerprint, signals, or decision-makers back.",
  ].join("\n");
}

/**
 * Batch summary prompt after per-domain rankings — input is scores only, not
 * full dossiers, so the stream stays tiny.
 */
export function buildBatchSummaryBrief(
  input: ProspectScanInput,
  rankings: ProspectRanking[],
): string {
  const vendor = input.vendorName ?? "the vendor";
  const compact = rankings.map(
    ({ domain, opportunityScore, tier, rationale }) => ({
      domain,
      opportunityScore,
      tier,
      rationale,
    }),
  );
  return [
    `You ranked ${rankings.length} account(s) for ${vendor}.`,
    `Vendor persona: ${input.vendorPersona}.`,
    "",
    "Per-account rankings (hottest first):",
    "```json",
    JSON.stringify(compact),
    "```",
    "",
    "Write a short batch-level summary (2-3 sentences) for the sales team: who to prioritize and why.",
  ].join("\n");
}

/**
 * Fold the orchestrator's per-account judgment back onto the evidence the
 * workflow already holds, producing the public `ProspectScanOutput`. The model
 * ranks by `domain` only; we rejoin the fingerprint/signals/decision-makers
 * from the dossier so evidence never has to survive a round-trip through the
 * model. Order follows the model's ranking; any scanned domain the model failed
 * to rank is appended as a `cool`/0 prospect so no account silently
 * disappears.
 */
export function mergeRankings(
  dossiers: DomainDossier[],
  synthesis: ProspectSynthesis,
): ProspectScanOutput {
  const byDomain = new Map(
    dossiers.map((dossier) => [dossier.domain, dossier]),
  );
  const ranked = new Set<string>();
  const prospects: RankedProspect[] = [];

  for (const ranking of synthesis.rankings) {
    const dossier = byDomain.get(ranking.domain);
    if (dossier === undefined || ranked.has(dossier.domain)) {
      continue; // unknown or duplicate domain from the model — drop it
    }
    ranked.add(dossier.domain);
    prospects.push({
      domain: dossier.domain,
      companyName: dossier.companyName,
      opportunityScore: ranking.opportunityScore,
      tier: ranking.tier,
      fingerprint: dossier.fingerprint,
      signals: dossier.signals,
      decisionMakers: dossier.decisionMakers,
      salesUseCases: ranking.salesUseCases,
      rationale: ranking.rationale,
    });
  }

  for (const dossier of dossiers) {
    if (ranked.has(dossier.domain)) {
      continue;
    }
    prospects.push({
      domain: dossier.domain,
      companyName: dossier.companyName,
      opportunityScore: 0,
      tier: "cool",
      fingerprint: dossier.fingerprint,
      signals: dossier.signals,
      decisionMakers: dossier.decisionMakers,
      salesUseCases: [],
      rationale:
        "Not ranked by the synthesis pass; review the evidence directly.",
    });
  }

  return { prospects, summary: synthesis.summary };
}
