import { describe, expect, it } from "vitest";

import {
  InvalidDomainError,
  normalizeDomain,
} from "../../src/lib/normalize-domain";

describe("normalizeDomain", () => {
  it("lowercases a bare domain", () => {
    expect(normalizeDomain("Example.COM")).toBe("example.com");
  });

  it("strips a scheme, path, and trailing slash", () => {
    expect(normalizeDomain("https://www.example.com/pricing")).toBe(
      "www.example.com",
    );
  });

  it("strips a port", () => {
    expect(normalizeDomain("example.com:8443")).toBe("example.com");
  });

  it("strips a trailing dot", () => {
    expect(normalizeDomain("example.com.")).toBe("example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeDomain("  example.com  ")).toBe("example.com");
  });

  it.each([
    "",
    "   ",
    "not a domain",
    "-example.com",
    "example",
    "exa mple.com",
  ])("rejects %j", (input) => {
    expect(() => normalizeDomain(input)).toThrow(InvalidDomainError);
  });
});
