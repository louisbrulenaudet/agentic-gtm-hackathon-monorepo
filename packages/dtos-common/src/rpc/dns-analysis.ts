import { ConfidenceLevel, ProviderCategory } from "@repo/enums-common";
import { z } from "zod";

// Canonical, already-normalized domain shape (lowercase, no scheme/path/port).
// `worker-dns` normalizes raw input before it reaches this schema; this only
// guards the wire shape of the `domain` field on the response.
const NormalizedDomainSchema = z
  .string()
  .min(1)
  .max(253)
  .regex(
    /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/,
    "must be a normalized lowercase domain name",
  );

export const DnsAnalysisRequestSchema = z.object({
  domain: z.string().trim().min(1).max(253),
});

export const DnsMxRecordSchema = z.object({
  exchange: z.string(),
  priority: z.number().int().nonnegative(),
});

export const DnsRecordsSchema = z.object({
  ns: z.array(z.string()),
  mx: z.array(DnsMxRecordSchema),
  txt: z.array(z.string()),
});

export const SpfInfoSchema = z.object({
  raw: z.string().nullable(),
  includes: z.array(z.string()),
});

export const DetectedProviderSchema = z.object({
  category: z.enum(ProviderCategory),
  vendor: z.string(),
  confidence: z.enum(ConfidenceLevel),
  evidence: z.array(z.string()).min(1),
});

export const DnsAnalysisResponseSchema = z.object({
  domain: NormalizedDomainSchema,
  records: DnsRecordsSchema,
  spf: SpfInfoSchema,
  providers: z.array(DetectedProviderSchema),
});

export type DnsAnalysisRequest = z.infer<typeof DnsAnalysisRequestSchema>;
export type DnsMxRecord = z.infer<typeof DnsMxRecordSchema>;
export type DnsRecords = z.infer<typeof DnsRecordsSchema>;
export type SpfInfo = z.infer<typeof SpfInfoSchema>;
export type DetectedProvider = z.infer<typeof DetectedProviderSchema>;
export type DnsAnalysisResponse = z.infer<typeof DnsAnalysisResponseSchema>;
