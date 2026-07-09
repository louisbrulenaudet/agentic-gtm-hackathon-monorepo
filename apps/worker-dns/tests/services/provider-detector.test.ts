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
});
