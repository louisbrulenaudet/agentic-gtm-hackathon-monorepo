import * as v from "valibot";

/**
 * Flue-internal (valibot) contracts for the single `prospect-scan` workflow —
 * the whole Agentic GTM pipeline: DNS tech-stack inference, Sillage signals +
 * org graph, FullEnrich contact enrichment, then opportunity ranking and
 * vendor-tailored sales use cases.
 *
 * These never cross an app HTTP/wire boundary (the orchestrator and its
 * subagents exchange them in-process), so the rest of the app stays on Zod.
 */

/** The 8 Sillage signal types (see `sillage_v2_get_signal_playbook`). */
export const GtmSignalTypeSchema = v.picklist([
  "keyword_detection",
  "job_posting_keyword_detection",
  "job_update",
  "competitor",
  "partner",
  "customer",
  "influencer",
  "champion",
]);

/** Input to `POST /workflows/prospect-scan`. */
export const ProspectScanInputSchema = v.object({
  domains: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1))),
    v.minLength(1, "Provide at least one company domain."),
    v.maxLength(25, "Scan at most 25 domains per batch."),
    v.description("Company domain names to scan, e.g. acme.com."),
  ),
  vendorPersona: v.pipe(
    v.string(),
    v.minLength(1, "Describe the vendor running the scan."),
    v.maxLength(4000),
    v.description(
      "Who is running the scan and what they sell — steers stage-4 use cases. e.g. 'Cloudflare AE selling Zero Trust, WAF, CDN, and Workers to technical buyers'.",
    ),
  ),
  vendorName: v.pipe(
    v.optional(v.string()),
    v.description("Short vendor name for phrasing, e.g. Cloudflare."),
  ),
});

/**
 * Normalized tech-stack fingerprint — `techstack_prober`'s result. Each slot is
 * the single best-guess vendor for that layer (null when unknown), plus the raw
 * detections and a Cloudflare-relevant posture read.
 */
export const TechFingerprintSchema = v.object({
  domain: v.string(),
  cdnProxy: v.nullable(v.string()),
  dnsProvider: v.nullable(v.string()),
  mailProvider: v.nullable(v.string()),
  crm: v.nullable(v.string()),
  sso: v.nullable(v.string()),
  marketing: v.nullable(v.string()),
  onCloudflare: v.pipe(
    v.boolean(),
    v.description(
      "True when NS/CDN evidence shows the domain runs Cloudflare.",
    ),
  ),
  summary: v.pipe(
    v.string(),
    v.description("One-line, human-readable read of the stack."),
  ),
});

/** A decision-maker surfaced by `signal_scout`, optionally enriched. */
export const DecisionMakerSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  title: v.nullable(v.string()),
  seniority: v.nullable(v.string()),
  linkedinUrl: v.nullable(v.string()),
  email: v.nullable(v.string()),
  phone: v.nullable(v.string()),
  contactFound: v.boolean(),
});

/** One interpreted commercial signal tied to the account. */
export const GtmSignalSchema = v.object({
  signalType: GtmSignalTypeSchema,
  summary: v.pipe(
    v.string(),
    v.description("What happened, in the prospect's own context."),
  ),
  personName: v.nullable(v.string()),
  whoToContact: v.pipe(
    v.string(),
    v.description(
      "The play's recommended target for this signal type (per the Sillage playbook).",
    ),
  ),
  sourceUrl: v.nullable(v.string()),
});

/** `signal_scout`'s result for one domain. */
export const SignalScoutResultSchema = v.object({
  domain: v.string(),
  companyName: v.nullable(v.string()),
  decisionMakers: v.array(DecisionMakerSchema),
  signals: v.array(GtmSignalSchema),
});

/** A tailored sales use case written by the orchestrator for the vendor. */
export const SalesUseCaseSchema = v.object({
  title: v.string(),
  wedge: v.pipe(
    v.string(),
    v.description(
      "The DNS/signal evidence this argument leans on, e.g. 'not on Cloudflare; SPF shows Marketo'.",
    ),
  ),
  argument: v.pipe(
    v.string(),
    v.description("The pitch that lands, 1-3 sentences, vendor-tailored."),
  ),
});

/** One ranked account in the final output. */
export const RankedProspectSchema = v.object({
  domain: v.string(),
  companyName: v.nullable(v.string()),
  opportunityScore: v.pipe(
    v.number(),
    v.minValue(0),
    v.maxValue(100),
    v.description("0-100 opportunity score; higher is a better fit right now."),
  ),
  tier: v.picklist(["hot", "warm", "cool"]),
  fingerprint: TechFingerprintSchema,
  signals: v.array(GtmSignalSchema),
  decisionMakers: v.array(DecisionMakerSchema),
  salesUseCases: v.array(SalesUseCaseSchema),
  rationale: v.pipe(
    v.string(),
    v.description(
      "Why this account ranks where it does, grounded in evidence.",
    ),
  ),
});

/**
 * The orchestrator's synthesis output for one account: the _judgment_ only —
 * score, tier, sales use cases, rationale. The evidence (fingerprint, signals,
 * decision-makers) is deliberately NOT re-emitted here; the workflow already
 * holds it in the dossier and merges it back by `domain`. Keeping the model's
 * output to the judgment keeps the synthesis stream small enough to finish
 * (re-emitting every dossier verbatim produced a multi-minute stream that the
 * gateway cut off with "Stream ended without finish_reason").
 */
export const ProspectRankingSchema = v.object({
  domain: v.pipe(
    v.string(),
    v.description("The scanned account this ranking is for — echo its domain."),
  ),
  opportunityScore: v.pipe(
    v.number(),
    v.minValue(0),
    v.maxValue(100),
    v.description("0-100 opportunity score; higher is a better fit right now."),
  ),
  tier: v.picklist(["hot", "warm", "cool"]),
  salesUseCases: v.array(SalesUseCaseSchema),
  rationale: v.pipe(
    v.string(),
    v.description(
      "Why this account ranks where it does, grounded in evidence.",
    ),
  ),
});

/**
 * The orchestrator's full synthesis output: one ranking per account + a
 * summary.
 */
export const ProspectSynthesisSchema = v.object({
  rankings: v.pipe(
    v.array(ProspectRankingSchema),
    v.description("One ranking per scanned account, hottest first."),
  ),
  summary: v.pipe(
    v.string(),
    v.description("A short batch-level read for the sales team."),
  ),
});

/** Result of `POST /workflows/prospect-scan`. */
export const ProspectScanOutputSchema = v.object({
  prospects: v.pipe(
    v.array(RankedProspectSchema),
    v.description("Accounts ranked most-promising first."),
  ),
  summary: v.pipe(
    v.string(),
    v.description("A short batch-level read for the sales team."),
  ),
});

export type GtmSignalType = v.InferOutput<typeof GtmSignalTypeSchema>;
export type ProspectScanInput = v.InferOutput<typeof ProspectScanInputSchema>;
export type TechFingerprint = v.InferOutput<typeof TechFingerprintSchema>;
export type DecisionMaker = v.InferOutput<typeof DecisionMakerSchema>;
export type GtmSignal = v.InferOutput<typeof GtmSignalSchema>;
export type SignalScoutResult = v.InferOutput<typeof SignalScoutResultSchema>;
export type SalesUseCase = v.InferOutput<typeof SalesUseCaseSchema>;
export type RankedProspect = v.InferOutput<typeof RankedProspectSchema>;
export type ProspectRanking = v.InferOutput<typeof ProspectRankingSchema>;
export type ProspectSynthesis = v.InferOutput<typeof ProspectSynthesisSchema>;
export type ProspectScanOutput = v.InferOutput<typeof ProspectScanOutputSchema>;
