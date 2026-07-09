import { z } from "zod";

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";

const DohAnswerSchema = z.object({
  name: z.string(),
  type: z.number(),
  TTL: z.number(),
  data: z.string(),
});

const DohResponseSchema = z.object({
  Status: z.number(),
  Answer: z.array(DohAnswerSchema).optional(),
});

export type DnsRecordType = "NS" | "MX" | "TXT";

export interface RawDnsRecords {
  ns: DohAnswer[];
  mx: DohAnswer[];
  txt: DohAnswer[];
}

/**
 * Queries Cloudflare's DNS-over-HTTPS JSON API for a single record type.
 * Workers have no native DNS resolver, so every lookup is a `fetch` subrequest
 * — see
 * https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/.
 */
export async function queryDnsRecords(
  domain: string,
  type: DnsRecordType,
): Promise<DohAnswer[]> {
  const url = new URL(DOH_ENDPOINT);
  url.searchParams.set("name", domain);
  url.searchParams.set("type", type);

  const response = await fetch(url, {
    headers: { accept: "application/dns-json" },
  });

  if (!response.ok) {
    throw new Error(
      `DNS-over-HTTPS query failed for ${domain} (${type}): ${response.status}`,
    );
  }

  const body = DohResponseSchema.parse(await response.json());
  return body.Answer ?? [];
}

export async function queryAllDnsRecords(
  domain: string,
): Promise<RawDnsRecords> {
  const [ns, mx, txt] = await Promise.all([
    queryDnsRecords(domain, "NS"),
    queryDnsRecords(domain, "MX"),
    queryDnsRecords(domain, "TXT"),
  ]);

  return { ns, mx, txt };
}

export type DohAnswer = z.infer<typeof DohAnswerSchema>;
