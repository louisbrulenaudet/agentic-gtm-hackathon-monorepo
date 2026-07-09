import { z } from "zod";

const NullableTextSchema = z.string().nullable().optional();

export const ReportBadgeSchema = z.object({
  label: z.string(),
  tone: z.enum(["amber", "blue", "green", "purple", "red", "slate"]),
});

export const ReportPainPointSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const ReportCompanySchema = z.object({
  name: z.string(),
  domain: z.string(),
  pop: NullableTextSchema,
  fitLabel: z.string().default("Cloudflare Fit"),
  fitScore: z.number().int().min(0).max(100),
  summary: z.string(),
  technicalDrivers: z.array(z.string()).default([]),
  badges: z.array(ReportBadgeSchema).default([]),
  painPoints: z.array(ReportPainPointSchema).default([]),
});

export const ReportHostnameFindingSchema = z.object({
  hostname: z.string(),
  cdn: NullableTextSchema,
  gateway: NullableTextSchema,
  httpStatus: NullableTextSchema,
  warnings: z.array(z.string()).default([]),
});

export const ReportStackSchema = z.object({
  domain: z.object({
    dnsProvider: NullableTextSchema,
    registrar: NullableTextSchema,
    createdAt: NullableTextSchema,
  }),
  email: z.object({
    provider: NullableTextSchema,
    marketingTools: z.array(z.string()).default([]),
    antiPhishing: z.array(z.string()).default([]),
  }),
  technologies: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.enum(["detected", "not_detected", "warning"]),
        primaryText: NullableTextSchema,
        tags: z.array(ReportBadgeSchema).default([]),
      }),
    )
    .default([]),
  serviceGroups: z
    .array(z.object({ label: z.string(), services: z.array(z.string()) }))
    .default([]),
});

export const ReportContactSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  title: NullableTextSchema,
  company: NullableTextSchema,
  linkedinUrl: NullableTextSchema,
  email: NullableTextSchema,
  emailStatus: z
    .enum(["DELIVERABLE", "HIGH_PROBABILITY", "CATCH_ALL", "INVALID"])
    .nullable()
    .optional(),
  phone: NullableTextSchema,
});

export const ReportPitchSchema = z.object({
  title: z.string(),
  technicalAngle: z.string(),
  businessAngle: z.string(),
  discoveryQuestions: z.array(z.string()).default([]),
});

export const ProspectReportSchema = z.object({
  runId: z.string(),
  generatedAt: z.string().optional(),
  company: ReportCompanySchema,
  pitch: ReportPitchSchema,
  hostnames: z.array(ReportHostnameFindingSchema).default([]),
  stack: ReportStackSchema,
  contacts: z.array(ReportContactSchema).default([]),
  debug: z
    .object({
      cdnByHostnameRaw: z.array(z.string()).default([]),
      httpHeaders: z
        .array(z.object({ name: z.string(), value: z.string() }))
        .default([]),
      mxRecords: z
        .array(z.object({ priority: z.number().int(), exchange: z.string() }))
        .default([]),
      nsRecords: z.array(z.string()).default([]),
    })
    .default({
      cdnByHostnameRaw: [],
      httpHeaders: [],
      mxRecords: [],
      nsRecords: [],
    }),
});

export type ReportBadge = z.infer<typeof ReportBadgeSchema>;
export type ReportCompany = z.infer<typeof ReportCompanySchema>;
export type ReportContact = z.infer<typeof ReportContactSchema>;
export type ReportPainPoint = z.infer<typeof ReportPainPointSchema>;
export type ProspectReport = z.infer<typeof ProspectReportSchema>;
