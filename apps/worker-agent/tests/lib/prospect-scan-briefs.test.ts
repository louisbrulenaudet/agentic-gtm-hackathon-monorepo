import { describe, expect, it } from "vitest";

import type { DomainDossier } from "../../src/lib/prospect-scan-briefs";
import {
  compactDossierForRanking,
  MAX_SIGNAL_FIELD_LENGTH,
  mergeRankings,
} from "../../src/lib/prospect-scan-briefs";

const fingerprint = {
  domain: "acme.com",
  cdnProxy: "Cloudflare",
  dnsProvider: "Cloudflare",
  mailProvider: "Google",
  crm: null,
  sso: null,
  marketing: "Marketo",
  onCloudflare: true,
  summary: "Proxied through Cloudflare; Google mail; Marketo in SPF.",
};

function makeDossier(overrides: Partial<DomainDossier> = {}): DomainDossier {
  return {
    domain: "acme.com",
    companyName: "Acme Corp",
    fingerprint,
    signals: [
      {
        signalType: "job_posting_keyword_detection",
        summary: "Hiring for edge compute.",
        personName: null,
        whoToContact: "VP Engineering",
        sourceUrl: null,
      },
    ],
    decisionMakers: [
      {
        firstName: "Jane",
        lastName: "Doe",
        title: "CTO",
        seniority: "C-level",
        linkedinUrl: "https://linkedin.com/in/jane",
        email: "jane@acme.com",
        phone: null,
        contactFound: true,
      },
    ],
    ...overrides,
  };
}

describe("compactDossierForRanking", () => {
  it("omits null contact fields from decision-makers", () => {
    const compact = compactDossierForRanking(makeDossier());

    expect(compact.decisionMakers[0]).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      title: "CTO",
      seniority: "C-level",
      linkedinUrl: "https://linkedin.com/in/jane",
      email: "jane@acme.com",
      contactFound: true,
    });
    expect(compact.decisionMakers[0]).not.toHaveProperty("phone");
  });

  it("truncates long signal text fields", () => {
    const longText = "x".repeat(MAX_SIGNAL_FIELD_LENGTH + 50);
    const compact = compactDossierForRanking(
      makeDossier({
        signals: [
          {
            signalType: "keyword_detection",
            summary: longText,
            personName: null,
            whoToContact: longText,
            sourceUrl: null,
          },
        ],
      }),
    );

    expect(compact.signals[0]?.summary.length).toBe(MAX_SIGNAL_FIELD_LENGTH);
    expect(compact.signals[0]?.whoToContact.length).toBe(
      MAX_SIGNAL_FIELD_LENGTH,
    );
    expect(compact.signals[0]?.summary.endsWith("…")).toBe(true);
  });

  it("produces a smaller JSON payload than the full dossier", () => {
    const dossier = makeDossier({
      decisionMakers: [
        {
          firstName: "Jane",
          lastName: "Doe",
          title: null,
          seniority: null,
          linkedinUrl: null,
          email: null,
          phone: null,
          contactFound: false,
        },
      ],
    });

    const fullLength = JSON.stringify(dossier).length;
    const compactLength = JSON.stringify(
      compactDossierForRanking(dossier),
    ).length;

    expect(compactLength).toBeLessThan(fullLength);
  });
});

describe("mergeRankings", () => {
  it("rejoins dossier evidence and preserves ranking order", () => {
    const dossiers = [
      makeDossier({ domain: "acme.com", companyName: "Acme" }),
      makeDossier({
        domain: "beta.io",
        companyName: "Beta",
        fingerprint: { ...fingerprint, domain: "beta.io" },
      }),
    ];

    const output = mergeRankings(dossiers, {
      rankings: [
        {
          domain: "beta.io",
          opportunityScore: 85,
          tier: "hot",
          salesUseCases: [
            {
              title: "Edge upsell",
              wedge: "Not on Cloudflare CDN",
              argument: "Migrate CDN to cut latency.",
            },
          ],
          rationale: "Strong fit and timing.",
        },
        {
          domain: "acme.com",
          opportunityScore: 40,
          tier: "warm",
          salesUseCases: [],
          rationale: "Moderate signals.",
        },
      ],
      summary: "Prioritize Beta, then Acme.",
    });

    expect(output.summary).toBe("Prioritize Beta, then Acme.");
    expect(output.prospects).toHaveLength(2);
    expect(output.prospects[0]?.domain).toBe("beta.io");
    expect(output.prospects[0]?.fingerprint.domain).toBe("beta.io");
    expect(output.prospects[0]?.decisionMakers).toHaveLength(1);
    expect(output.prospects[1]?.domain).toBe("acme.com");
  });

  it("drops unknown and duplicate domains from model rankings", () => {
    const dossiers = [makeDossier()];

    const output = mergeRankings(dossiers, {
      rankings: [
        {
          domain: "unknown.com",
          opportunityScore: 99,
          tier: "hot",
          salesUseCases: [],
          rationale: "Should be dropped.",
        },
        {
          domain: "acme.com",
          opportunityScore: 70,
          tier: "hot",
          salesUseCases: [],
          rationale: "First valid rank.",
        },
        {
          domain: "acme.com",
          opportunityScore: 50,
          tier: "warm",
          salesUseCases: [],
          rationale: "Duplicate — should be dropped.",
        },
      ],
      summary: "Batch read.",
    });

    expect(output.prospects).toHaveLength(1);
    expect(output.prospects[0]?.opportunityScore).toBe(70);
  });

  it("appends unranked dossiers as cool prospects", () => {
    const dossiers = [
      makeDossier({ domain: "acme.com" }),
      makeDossier({
        domain: "missing-rank.com",
        fingerprint: { ...fingerprint, domain: "missing-rank.com" },
      }),
    ];

    const output = mergeRankings(dossiers, {
      rankings: [
        {
          domain: "acme.com",
          opportunityScore: 60,
          tier: "warm",
          salesUseCases: [],
          rationale: "Ranked.",
        },
      ],
      summary: "One account ranked.",
    });

    expect(output.prospects).toHaveLength(2);
    expect(output.prospects[1]?.domain).toBe("missing-rank.com");
    expect(output.prospects[1]?.tier).toBe("cool");
    expect(output.prospects[1]?.opportunityScore).toBe(0);
    expect(output.prospects[1]?.salesUseCases).toEqual([]);
  });
});
