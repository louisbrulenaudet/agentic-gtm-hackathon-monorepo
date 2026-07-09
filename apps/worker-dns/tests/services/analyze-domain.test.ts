import { ProviderCategory } from "@repo/enums-common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RawDnsRecords } from "../../src/services/dns-client";

const queryAllDnsRecords = vi.fn<() => Promise<RawDnsRecords>>();

vi.mock("../../src/services/dns-client", () => ({
  queryAllDnsRecords: (domain: string) => queryAllDnsRecords(domain),
}));

describe("analyzeDomain", () => {
  beforeEach(() => {
    queryAllDnsRecords.mockReset();
  });

  it("normalizes input, resolves records, and detects providers end to end", async () => {
    queryAllDnsRecords.mockResolvedValue({
      ns: [
        { name: "example.com", type: 2, TTL: 300, data: "ns1.cloudflare.com." },
      ],
      mx: [
        {
          name: "example.com",
          type: 15,
          TTL: 300,
          data: "10 aspmx.l.google.com.",
        },
      ],
      txt: [
        {
          name: "example.com",
          type: 16,
          TTL: 300,
          data: '"v=spf1 include:_spf.google.com ~all"',
        },
        {
          name: "example.com",
          type: 16,
          TTL: 300,
          data: '"hubspot-developer-verification=abc"',
        },
      ],
    });

    const { analyzeDomain } = await import("../../src/services/analyze-domain");
    const result = await analyzeDomain("HTTPS://Example.com/pricing");

    expect(queryAllDnsRecords).toHaveBeenCalledWith("example.com");
    expect(result.domain).toBe("example.com");
    expect(result.records.ns).toEqual(["ns1.cloudflare.com"]);
    expect(result.records.mx).toEqual([
      { exchange: "aspmx.l.google.com", priority: 10 },
    ]);
    expect(result.spf.includes).toEqual(["_spf.google.com"]);

    const vendors = result.providers.map(
      (provider) => `${provider.category}:${provider.vendor}`,
    );
    expect(vendors).toContain(`${ProviderCategory.DNS_PROVIDER}:Cloudflare`);
    expect(vendors).toContain(
      `${ProviderCategory.EMAIL_PROVIDER}:Google Workspace`,
    );
    expect(vendors).toContain(`${ProviderCategory.CRM}:HubSpot`);
  });

  it("rejects an invalid domain before making any DNS query", async () => {
    const { analyzeDomain } = await import("../../src/services/analyze-domain");
    await expect(analyzeDomain("not a domain")).rejects.toThrow();
    expect(queryAllDnsRecords).not.toHaveBeenCalled();
  });
});
