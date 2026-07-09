import { describe, expect, it } from "vitest";

import type { DohAnswer } from "../../src/services/dns-client";
import {
  extractSpfInfo,
  normalizeMxRecords,
  normalizeNsRecords,
  normalizeTxtRecords,
} from "../../src/services/dns-normalizer";

function answer(data: string): DohAnswer {
  return { name: "example.com", type: 0, TTL: 300, data };
}

describe("normalizeNsRecords", () => {
  it("lowercases, strips trailing dots, and dedupes", () => {
    const result = normalizeNsRecords([
      answer("NS1.CLOUDFLARE.COM."),
      answer("ns2.cloudflare.com."),
      answer("ns1.cloudflare.com."),
    ]);
    expect(result).toEqual(["ns1.cloudflare.com", "ns2.cloudflare.com"]);
  });
});

describe("normalizeMxRecords", () => {
  it("parses priority and exchange, dropping the trailing dot", () => {
    const result = normalizeMxRecords([answer("10 ASPMX.L.GOOGLE.COM.")]);
    expect(result).toEqual([{ priority: 10, exchange: "aspmx.l.google.com" }]);
  });

  it("drops malformed MX data", () => {
    expect(normalizeMxRecords([answer("not-a-priority")])).toEqual([]);
    expect(normalizeMxRecords([answer("abc aspmx.l.google.com.")])).toEqual([]);
  });
});

describe("normalizeTxtRecords", () => {
  it("strips the surrounding DoH quoting", () => {
    expect(
      normalizeTxtRecords([answer('"v=spf1 include:_spf.google.com ~all"')]),
    ).toEqual(["v=spf1 include:_spf.google.com ~all"]);
  });
});

describe("extractSpfInfo", () => {
  it("finds the SPF record and parses every include", () => {
    const spf = extractSpfInfo([
      "v=spf1 include:_spf.google.com include:sendgrid.net ~all",
      "hubspot-developer-verification=abc123",
    ]);
    expect(spf.raw).toBe(
      "v=spf1 include:_spf.google.com include:sendgrid.net ~all",
    );
    expect(spf.includes).toEqual(["_spf.google.com", "sendgrid.net"]);
  });

  it("returns null when there is no SPF record", () => {
    expect(extractSpfInfo(["hubspot-developer-verification=abc123"])).toEqual({
      raw: null,
      includes: [],
    });
  });

  it("lowercases includes since hostnames are case-insensitive", () => {
    const spf = extractSpfInfo(["v=spf1 Include:SPF.Brevo.COM ~all"]);
    expect(spf.includes).toEqual(["spf.brevo.com"]);
  });
});
