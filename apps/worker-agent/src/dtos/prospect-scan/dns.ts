import * as v from "valibot";

/**
 * Valibot mirror of `worker-dns`'s `DnsAnalysisResponse` (a Zod DTO in
 * `@repo/dtos-common/rpc`), used as the `analyze_domain` tool's `output` slot.
 *
 * Flue tool `input`/`output` slots are valibot-typed, and the repo's one-source
 * rule allows a framework-slot mirror of a shared shape (see contracts.md — the
 * validator-slot exception). It is deliberately **lenient** (plain strings, no
 * enum picklists or length floors) so a well-formed DNS response never fails
 * output validation and crashes the tool; the `techstack_prober` subagent reads
 * these values as text and normalizes them into the tech fingerprint.
 */
export const DnsMxRecordSchema = v.object({
  exchange: v.string(),
  priority: v.number(),
});

export const DnsRecordsSchema = v.object({
  ns: v.array(v.string()),
  mx: v.array(DnsMxRecordSchema),
  txt: v.array(v.string()),
});

export const SpfInfoSchema = v.object({
  raw: v.nullable(v.string()),
  includes: v.array(v.string()),
});

export const DetectedProviderSchema = v.object({
  category: v.pipe(
    v.string(),
    v.description(
      "Provider category, e.g. DNS_PROVIDER, CDN_PROXY, EMAIL_PROVIDER, CRM, MARKETING_AUTOMATION, SSO_IDP, ANALYTICS, OTHER_SAAS.",
    ),
  ),
  vendor: v.pipe(
    v.string(),
    v.description("Detected vendor name, e.g. Cloudflare, HubSpot, Okta."),
  ),
  confidence: v.pipe(
    v.string(),
    v.description("Detection confidence: LOW, MEDIUM, or HIGH."),
  ),
  evidence: v.pipe(
    v.array(v.string()),
    v.description("The DNS records/tokens that support this detection."),
  ),
});

export const DnsAnalysisResultSchema = v.object({
  domain: v.string(),
  records: DnsRecordsSchema,
  spf: SpfInfoSchema,
  providers: v.pipe(
    v.array(DetectedProviderSchema),
    v.description(
      "Providers fingerprinted from public DNS/SPF/MX, one entry per detection.",
    ),
  ),
});

export type DnsAnalysisResult = v.InferOutput<typeof DnsAnalysisResultSchema>;
