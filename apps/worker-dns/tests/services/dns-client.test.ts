import { afterEach, describe, expect, it, vi } from "vitest";

import {
  queryAllDnsRecords,
  queryDnsRecords,
} from "../../src/services/dns-client";

function dohResponse(answer: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ Status: 0, Answer: [answer] }), {
    status: 200,
    headers: { "content-type": "application/dns-json" },
  });
}

describe("queryDnsRecords", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the JSON DoH API with the right query params and header", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      dohResponse({
        name: "example.com.",
        type: 16,
        TTL: 300,
        data: "hello",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const answers = await queryDnsRecords("example.com", "TXT");

    expect(answers).toEqual([
      { name: "example.com.", type: 16, TTL: 300, data: "hello" },
    ]);

    const [requestedUrl, requestedInit] = fetchMock.mock.calls[0] ?? [];
    if (!(requestedUrl instanceof URL)) {
      throw new Error("expected fetch to be called with a URL");
    }
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      "https://cloudflare-dns.com/dns-query",
    );
    expect(requestedUrl.searchParams.get("name")).toBe("example.com");
    expect(requestedUrl.searchParams.get("type")).toBe("TXT");
    expect(new Headers(requestedInit?.headers).get("accept")).toBe(
      "application/dns-json",
    );
  });

  it("returns an empty array when there is no Answer section", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(JSON.stringify({ Status: 3 }), { status: 200 }),
        ),
    );

    expect(await queryDnsRecords("example.com", "MX")).toEqual([]);
  });

  it("throws when the upstream response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("", { status: 500 })),
    );
    await expect(queryDnsRecords("example.com", "NS")).rejects.toThrow(/500/);
  });
});

describe("queryAllDnsRecords", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queries NS, MX, and TXT concurrently", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const type = new URL(
        input instanceof Request ? input.url : input,
      ).searchParams.get("type");
      return Promise.resolve(
        dohResponse({ name: "example.com.", type: 0, TTL: 300, data: type }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await queryAllDnsRecords("example.com");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.ns[0]?.data).toBe("NS");
    expect(result.mx[0]?.data).toBe("MX");
    expect(result.txt[0]?.data).toBe("TXT");
  });
});
