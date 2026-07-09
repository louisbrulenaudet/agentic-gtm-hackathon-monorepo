import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnrichmentRecord } from "../../src/lib/full-enrich-client";
import {
  getBulkEnrichmentResult,
  pollBulkEnrichmentUntilDone,
  submitBulkEnrichment,
  toMappedContact,
} from "../../src/lib/full-enrich-client";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("submitBulkEnrichment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the bulk endpoint with the documented request shape", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ enrichment_id: "job-123" }));
    vi.stubGlobal("fetch", fetchMock);

    const enrichmentId = await submitBulkEnrichment(
      [
        {
          firstname: "Ada",
          lastname: "Lovelace",
          domain: "acme.com",
          correlationId: "corr-1",
        },
      ],
      "test-key",
    );

    expect(enrichmentId).toBe("job-123");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://app.fullenrich.com/api/v1/contact/enrich/bulk");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer test-key",
    );

    if (typeof init?.body !== "string") {
      throw new Error("expected the request body to be a JSON string");
    }
    const body = JSON.parse(init.body);
    expect(body.datas).toEqual([
      {
        firstname: "Ada",
        lastname: "Lovelace",
        domain: "acme.com",
        company_name: undefined,
        linkedin_url: undefined,
        enrich_fields: ["contact.emails", "contact.phones"],
        custom: { correlationId: "corr-1" },
      },
    ]);
  });

  it("throws when the submission is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("", { status: 401 })),
    );

    await expect(
      submitBulkEnrichment(
        [{ firstname: "Ada", lastname: "Lovelace", correlationId: "corr-1" }],
        "bad-key",
      ),
    ).rejects.toThrow(/401/);
  });
});

describe("getBulkEnrichmentResult", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets forceResults only when requested", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "job-123",
        name: "batch",
        status: "FINISHED",
        datas: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getBulkEnrichmentResult("job-123", "test-key", true);

    const [url] = fetchMock.mock.calls[0] ?? [];
    if (!(url instanceof URL)) {
      throw new Error("expected fetch to be called with a URL");
    }
    expect(url.searchParams.get("forceResults")).toBe("true");
  });
});

describe("pollBulkEnrichmentUntilDone", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stops as soon as the job reaches a terminal status", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          id: "job-1",
          name: "batch",
          status: "IN_PROGRESS",
          datas: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "job-1",
          name: "batch",
          status: "FINISHED",
          datas: [],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await pollBulkEnrichmentUntilDone("job-1", "test-key", {
      intervalMs: 1,
    });

    expect(result.status).toBe("FINISHED");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("force-fetches once maxAttempts is exhausted rather than polling forever", async () => {
    // `mockImplementation` (not `mockResolvedValue`) so every call gets a
    // fresh `Response` — a single shared instance's body can only be read once.
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          id: "job-1",
          name: "batch",
          status: "IN_PROGRESS",
          datas: [],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await pollBulkEnrichmentUntilDone("job-1", "test-key", {
      intervalMs: 1,
      maxAttempts: 2,
    });

    expect(result.status).toBe("IN_PROGRESS");
    // 2 polling attempts + 1 final forced fetch.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const lastUrl = fetchMock.mock.calls.at(-1)?.[0];
    if (!(lastUrl instanceof URL)) {
      throw new Error("expected fetch to be called with a URL");
    }
    expect(lastUrl.searchParams.get("forceResults")).toBe("true");
  });
});

describe("toMappedContact", () => {
  it("marks a contact as found when an email or phone is present", () => {
    const record: EnrichmentRecord = {
      contact: {
        firstname: "Ada",
        lastname: "Lovelace",
        most_probable_email: "ada@acme.com",
        most_probable_email_status: "DELIVERABLE",
        most_probable_phone: null,
      },
    };

    expect(toMappedContact(record)).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@acme.com",
      emailStatus: "DELIVERABLE",
      phone: null,
      found: true,
    });
  });

  it("marks a contact as not found when neither email nor phone is present", () => {
    const record: EnrichmentRecord = {
      contact: { firstname: "Ada", lastname: "Lovelace" },
    };

    expect(toMappedContact(record).found).toBe(false);
  });
});
