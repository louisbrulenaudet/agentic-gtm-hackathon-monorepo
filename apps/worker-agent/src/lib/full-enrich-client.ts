import { z } from "zod";

const FULL_ENRICH_BULK_URL =
  "https://app.fullenrich.com/api/v1/contact/enrich/bulk";

const BulkEnrichmentStatusSchema = z.enum([
  "CREATED",
  "IN_PROGRESS",
  "CANCELED",
  "CREDITS_INSUFFICIENT",
  "FINISHED",
  "RATE_LIMIT",
  "UNKNOWN",
]);

const TERMINAL_STATUSES = new Set<z.infer<typeof BulkEnrichmentStatusSchema>>([
  "FINISHED",
  "CANCELED",
  "CREDITS_INSUFFICIENT",
  "RATE_LIMIT",
  "UNKNOWN",
]);

const EnrichmentContactSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  domain: z.string().nullable().optional(),
  most_probable_email: z.string().nullable().optional(),
  most_probable_email_status: z.string().nullable().optional(),
  most_probable_phone: z.string().nullable().optional(),
});

const EnrichmentRecordSchema = z.object({
  custom: z.record(z.string(), z.string()).optional(),
  contact: EnrichmentContactSchema,
});

const SubmitBulkEnrichmentResponseSchema = z.object({
  enrichment_id: z.string(),
});

const BulkEnrichmentResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: BulkEnrichmentStatusSchema,
  datas: z.array(EnrichmentRecordSchema),
});

export type EnrichmentRecord = z.infer<typeof EnrichmentRecordSchema>;
export type BulkEnrichmentResult = z.infer<typeof BulkEnrichmentResultSchema>;

export interface FullEnrichContactInput {
  firstname: string;
  lastname: string;
  domain?: string;
  companyName?: string;
  linkedinUrl?: string;
  /** Echoed back via FullEnrich's `custom` field to match results to requests. */
  correlationId: string;
}

/**
 * Submits one bulk enrichment job (1-100 contacts) and returns its
 * `enrichment_id`. See
 * https://docs.fullenrich.com/api/v1/contact/enrich/bulk/post.
 */
export async function submitBulkEnrichment(
  contacts: FullEnrichContactInput[],
  apiKey: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(FULL_ENRICH_BULK_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: `worker-agent-${Date.now()}`,
      datas: contacts.map((contact) => ({
        firstname: contact.firstname,
        lastname: contact.lastname,
        domain: contact.domain,
        company_name: contact.companyName,
        linkedin_url: contact.linkedinUrl,
        enrich_fields: ["contact.emails", "contact.phones"],
        custom: { correlationId: contact.correlationId },
      })),
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `FullEnrich bulk enrichment submission failed: ${response.status}`,
    );
  }

  const body = SubmitBulkEnrichmentResponseSchema.parse(await response.json());
  return body.enrichment_id;
}

/**
 * See https://docs.fullenrich.com/api/v1/contact/enrich/bulk/get.
 * `forceResults` returns whatever has been found so far even if unfinished.
 */
export async function getBulkEnrichmentResult(
  enrichmentId: string,
  apiKey: string,
  forceResults = false,
  signal?: AbortSignal,
): Promise<BulkEnrichmentResult> {
  const url = new URL(`${FULL_ENRICH_BULK_URL}/${enrichmentId}`);
  if (forceResults) {
    url.searchParams.set("forceResults", "true");
  }

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${apiKey}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `FullEnrich result lookup failed for ${enrichmentId}: ${response.status}`,
    );
  }

  return BulkEnrichmentResultSchema.parse(await response.json());
}

export interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
}

/**
 * FullEnrich enrichment is asynchronous. Polls until the job reaches a terminal
 * status, or returns whatever is available so far after `maxAttempts` (via
 * `forceResults`) rather than hanging indefinitely.
 */
export async function pollBulkEnrichmentUntilDone(
  enrichmentId: string,
  apiKey: string,
  options: PollOptions = {},
): Promise<BulkEnrichmentResult> {
  return pollAttempt(enrichmentId, apiKey, {
    intervalMs: options.intervalMs ?? 2000,
    maxAttempts: options.maxAttempts ?? 15,
    signal: options.signal,
    attempt: 0,
  });
}

interface PollAttemptOptions {
  intervalMs: number;
  maxAttempts: number;
  signal?: AbortSignal;
  attempt: number;
}

// Recursive rather than a loop: each poll depends on the previous attempt's
// result plus a delay, so there is no independent work to run via
// `Promise.all` — a `for` loop here would just trip `no-await-in-loop`.
async function pollAttempt(
  enrichmentId: string,
  apiKey: string,
  { intervalMs, maxAttempts, signal, attempt }: PollAttemptOptions,
): Promise<BulkEnrichmentResult> {
  if (attempt >= maxAttempts) {
    return getBulkEnrichmentResult(enrichmentId, apiKey, true, signal);
  }

  const result = await getBulkEnrichmentResult(
    enrichmentId,
    apiKey,
    false,
    signal,
  );
  if (TERMINAL_STATUSES.has(result.status)) {
    return result;
  }

  await sleep(intervalMs);
  return pollAttempt(enrichmentId, apiKey, {
    intervalMs,
    maxAttempts,
    signal,
    attempt: attempt + 1,
  });
}

// Mirrors the picklist in `dtos/contact-enrichment.ts`'s `EmailStatusSchema`.
// Duplicated deliberately rather than shared: this file validates FullEnrich's
// raw response (a plain external-API boundary, Zod-flavored by convention),
// while the dtos file is the Flue schema slot (valibot) — two independent
// validation layers over the same external fact.
const EMAIL_STATUSES = [
  "DELIVERABLE",
  "HIGH_PROBABILITY",
  "CATCH_ALL",
  "INVALID",
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

function isEmailStatus(value: string): value is EmailStatus {
  return (EMAIL_STATUSES as readonly string[]).includes(value);
}

export interface MappedContact {
  firstName: string;
  lastName: string;
  email: string | null;
  emailStatus: EmailStatus | null;
  phone: string | null;
  found: boolean;
}

/** Maps one raw FullEnrich record into this app's clean contact shape. */
export function toMappedContact(record: EnrichmentRecord): MappedContact {
  const { contact } = record;
  const email = contact.most_probable_email ?? null;
  const phone = contact.most_probable_phone ?? null;
  const rawStatus = contact.most_probable_email_status ?? null;

  return {
    firstName: contact.firstname,
    lastName: contact.lastname,
    email,
    emailStatus:
      rawStatus !== null && isEmailStatus(rawStatus) ? rawStatus : null,
    phone,
    found: email !== null || phone !== null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
