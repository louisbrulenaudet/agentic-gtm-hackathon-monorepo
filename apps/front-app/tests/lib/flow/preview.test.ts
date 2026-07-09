import { describe, expect, it } from "vitest";
import { buildResultPreview } from "@/lib/flow/preview";

describe("buildResultPreview", () => {
  it("summarizes signal_scout results", () => {
    const previews = buildResultPreview("signal_scout", {
      companyName: "Acme",
      signals: [{}, {}],
      decisionMakers: [{}],
    });

    expect(previews).toEqual(
      expect.arrayContaining([
        { label: "signaux", value: "2 signaux" },
        { label: "décideurs", value: "1 décideur" },
        { label: "entreprise", value: "Acme" },
      ]),
    );
  });

  it("summarizes contact_enricher results", () => {
    const found = buildResultPreview("contact_enricher", {
      found: true,
      email: "jane@acme.com",
      error: null,
    });
    expect(found.some((f) => f.label === "contact")).toBe(true);

    const notFound = buildResultPreview("contact_enricher", {
      found: false,
      error: "FullEnrich is not configured",
    });
    expect(notFound.some((f) => f.label === "erreur")).toBe(true);
  });

  it("summarizes MCP tool results with content blocks", () => {
    const previews = buildResultPreview("mcp__sillage__list_signals", {
      content: [{ type: "text" }, { type: "text" }],
    });

    expect(previews).toEqual([
      { label: "réponse", value: "2 blocs de contenu" },
    ]);
  });
});
