import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  ContactQuerySchema,
  EnrichContactsInputSchema,
  EnrichedContactSchema,
} from "../../src/dtos/contact-enrichment";

describe("ContactQuerySchema", () => {
  it("accepts a contact identified by a company domain", () => {
    const result = v.safeParse(ContactQuerySchema, {
      firstName: "Ada",
      lastName: "Lovelace",
      companyDomain: "acme.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a contact identified by a LinkedIn URL alone", () => {
    const result = v.safeParse(ContactQuerySchema, {
      firstName: "Ada",
      lastName: "Lovelace",
      linkedinUrl: "https://www.linkedin.com/in/ada-lovelace",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name with no company or LinkedIn URL", () => {
    const result = v.safeParse(ContactQuerySchema, {
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty first name", () => {
    const result = v.safeParse(ContactQuerySchema, {
      firstName: "",
      lastName: "Lovelace",
      companyDomain: "acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed LinkedIn URL", () => {
    const result = v.safeParse(ContactQuerySchema, {
      firstName: "Ada",
      lastName: "Lovelace",
      linkedinUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("EnrichedContactSchema", () => {
  it("accepts a found contact", () => {
    const result = v.safeParse(EnrichedContactSchema, {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@acme.com",
      emailStatus: "DELIVERABLE",
      phone: null,
      found: true,
      error: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an unconfigured/error result in the same shape", () => {
    const result = v.safeParse(EnrichedContactSchema, {
      firstName: "Ada",
      lastName: "Lovelace",
      email: null,
      emailStatus: null,
      phone: null,
      found: false,
      error: "FullEnrich is not configured (FULLENRICH_API_KEY is unset).",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown emailStatus value", () => {
    const result = v.safeParse(EnrichedContactSchema, {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@acme.com",
      emailStatus: "PROBABLY_FINE",
      phone: null,
      found: true,
      error: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("EnrichContactsInputSchema", () => {
  it("rejects an empty contact list", () => {
    const result = v.safeParse(EnrichContactsInputSchema, { contacts: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 100 contacts (FullEnrich's own bulk limit)", () => {
    const contacts = Array.from({ length: 101 }, (_, index) => ({
      firstName: "Ada",
      lastName: `Lovelace${index}`,
      companyDomain: "acme.com",
    }));
    const result = v.safeParse(EnrichContactsInputSchema, { contacts });
    expect(result.success).toBe(false);
  });
});
