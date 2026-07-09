import { ConfidenceLevel, ProviderCategory } from "@repo/enums-common";
import { describe, expect, it } from "vitest";

import { detectProviders } from "../../src/services/provider-detector";

describe("detectProviders", () => {
  it("detects a vendor from a single record source", () => {
    const providers = detectProviders({
      ns: ["ns1.cloudflare.com"],
      mxExchanges: [],
      txt: [],
      spfIncludes: [],
    });

    expect(providers).toContainEqual({
      category: ProviderCategory.DNS_PROVIDER,
      vendor: "Cloudflare",
      confidence: ConfidenceLevel.HIGH,
      evidence: [
        'NS record "ns1.cloudflare.com" matched pattern "cloudflare.com"',
      ],
    });
  });

  it("merges evidence from multiple records into one detection per vendor+category", () => {
    const providers = detectProviders({
      ns: [],
      mxExchanges: ["aspmx.l.google.com"],
      txt: [],
      spfIncludes: ["_spf.google.com"],
    });

    const googleWorkspace = providers.find(
      (provider) =>
        provider.vendor === "Google Workspace" &&
        provider.category === ProviderCategory.EMAIL_PROVIDER,
    );

    expect(googleWorkspace).toBeDefined();
    expect(googleWorkspace?.evidence).toHaveLength(2);
  });

  it("returns no detections when nothing matches", () => {
    expect(
      detectProviders({
        ns: ["ns1.example.com"],
        mxExchanges: [],
        txt: [],
        spfIncludes: [],
      }),
    ).toEqual([]);
  });

  it("detects a category from a TXT verification token", () => {
    const providers = detectProviders({
      ns: [],
      mxExchanges: [],
      txt: ["hubspot-developer-verification=abc123"],
      spfIncludes: [],
    });

    expect(providers).toContainEqual(
      expect.objectContaining({
        vendor: "HubSpot",
        category: ProviderCategory.CRM,
      }),
    );
  });

  it("does not false-positive on a hostname that merely contains a pattern as a substring", () => {
    // "notcloudflare.com" contains "cloudflare.com" as a raw substring but is
    // not on a DNS label boundary — must not match.
    const providers = detectProviders({
      ns: ["ns1.notcloudflare.com"],
      mxExchanges: [],
      txt: [],
      spfIncludes: [],
    });

    expect(providers.some((provider) => provider.vendor === "Cloudflare")).toBe(
      false,
    );
  });

  it("matches a provider-specific suffix glued directly onto the distinctive label", () => {
    // AWS Route 53 nameservers look like ns-1472.awsdns-56.org — "awsdns" is
    // immediately followed by "-56", not a dot.
    const providers = detectProviders({
      ns: ["ns-1472.awsdns-56.org"],
      mxExchanges: [],
      txt: [],
      spfIncludes: [],
    });

    expect(providers).toContainEqual(
      expect.objectContaining({
        vendor: "AWS Route 53",
        category: ProviderCategory.DNS_PROVIDER,
      }),
    );
  });

  it("detects a marketing automation vendor from an SPF include", () => {
    const providers = detectProviders({
      ns: [],
      mxExchanges: [],
      txt: [],
      spfIncludes: ["spf.brevo.com"],
    });

    expect(providers).toContainEqual(
      expect.objectContaining({
        vendor: "Brevo",
        category: ProviderCategory.MARKETING_AUTOMATION,
      }),
    );
  });
});
