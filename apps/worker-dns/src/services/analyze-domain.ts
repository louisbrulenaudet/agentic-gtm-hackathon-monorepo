import type { DnsAnalysisResponse } from "@repo/dtos-common/rpc";
import { DnsAnalysisResponseSchema } from "@repo/dtos-common/rpc";

import { normalizeDomain } from "../lib/normalize-domain";
import { queryAllDnsRecords } from "./dns-client";
import {
  extractSpfInfo,
  normalizeMxRecords,
  normalizeNsRecords,
  normalizeTxtRecords,
} from "./dns-normalizer";
import { detectProviders } from "./provider-detector";

/**
 * Full pipeline: normalize the input domain, resolve NS/MX/TXT over DoH, parse
 * SPF `include:`s out of TXT, and run every record through the provider
 * fingerprint table.
 */
export async function analyzeDomain(
  rawDomain: string,
): Promise<DnsAnalysisResponse> {
  const domain = normalizeDomain(rawDomain);
  const raw = await queryAllDnsRecords(domain);

  const ns = normalizeNsRecords(raw.ns);
  const mx = normalizeMxRecords(raw.mx);
  const txt = normalizeTxtRecords(raw.txt);
  const spf = extractSpfInfo(txt);

  const providers = detectProviders({
    ns,
    mxExchanges: mx.map((record) => record.exchange),
    txt,
    spfIncludes: spf.includes,
  });

  return DnsAnalysisResponseSchema.parse({
    domain,
    records: { ns, mx, txt },
    spf,
    providers,
  });
}
