import { afterEach, describe, expect, it, vi } from "vitest";

import { enrichContact } from "../../src/tools/full-enrich";
import { env } from "../stubs/cloudflare-workers";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

const noopEmit = () => {
  /* not used by this tool */
};

describe("enrichContact tool", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    env.FULLENRICH_API_KEY = undefined;
  });

  it("returns a configuration error when FULLENRICH_API_KEY is unset", async () => {
    env.FULLENRICH_API_KEY = undefined;

    const result = await enrichContact.run({
      input: {
        firstName: "Ada",
        lastName: "Lovelace",
        companyDomain: "acme.com",
      },
      emitData: noopEmit,
    });

    expect(result.found).toBe(false);
    expect(result.error).toMatch(/not configured/);
  });

  it("returns the enriched contact on a successful lookup", async () => {
    env.FULLENRICH_API_KEY = "test-key";

    // Route by argument shape: submitBulkEnrichment calls fetch with the
    // plain URL string, getBulkEnrichmentResult with a `new URL(...)`.
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      if (typeof input === "string") {
        return Promise.resolve(jsonResponse({ enrichment_id: "job-1" }));
      }
      return Promise.resolve(
        jsonResponse({
          id: "job-1",
          name: "batch",
          status: "FINISHED",
          datas: [
            {
              custom: { correlationId: "unrelated" },
              contact: {
                firstname: "Ada",
                lastname: "Lovelace",
                most_probable_email: "ada@acme.com",
                most_probable_email_status: "DELIVERABLE",
                most_probable_phone: null,
              },
            },
          ],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await enrichContact.run({
      input: {
        firstName: "Ada",
        lastName: "Lovelace",
        companyDomain: "acme.com",
      },
      emitData: noopEmit,
    });

    expect(result).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@acme.com",
      emailStatus: "DELIVERABLE",
      phone: null,
      found: true,
      error: null,
    });
  });

  it("returns a graceful error when the FullEnrich request fails", async () => {
    env.FULLENRICH_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("", { status: 500 })),
    );

    const result = await enrichContact.run({
      input: {
        firstName: "Ada",
        lastName: "Lovelace",
        companyDomain: "acme.com",
      },
      emitData: noopEmit,
    });

    expect(result.found).toBe(false);
    expect(result.error).toMatch(/FullEnrich lookup failed/);
  });
});
