import {
  defineWorkflow,
  type FlueHarness,
  type WorkflowRouteHandler,
  type WorkflowRunsHandler,
} from "@flue/runtime";

import orchestrator from "../agents/orchestrator";
import {
  BatchSummarySchema,
  EnrichedContactSchema,
  type ProspectScanInput,
  ProspectScanInputSchema,
  ProspectScanOutputSchema,
  ProspectRankingSchema,
  SignalScoutResultSchema,
  TechFingerprintSchema,
} from "../dtos";
import {
  buildBatchSummaryBrief,
  buildEnrichBrief,
  buildPerDomainRankingBrief,
  buildScoutBrief,
  buildTechBrief,
  type DomainDossier,
  MAX_ENRICH_PER_DOMAIN,
  mergeContact,
  mergeRankings,
} from "../lib/prospect-scan-briefs";

export const description =
  "Agentic GTM prospect scan: for each submitted domain, concurrently infers the tech stack (DNS), scouts Sillage signals + decision-makers, and enriches contacts (FullEnrich), then the orchestrator ranks accounts and writes vendor-tailored sales use cases.";

// Exposes POST /workflows/prospect-scan. Hackathon: no auth guard — the browser
// SPA calls this Worker directly behind a strict CORS allowlist (see app.ts).
// Re-add `requireApiKey` here for any non-hackathon deployment.
export const route: WorkflowRouteHandler = async (_c, next) => next();

// Exposes GET /runs/:runId for runs owned by this workflow — same hackathon
// pass-through as the other workflows.
export const runs: WorkflowRunsHandler = async (_c, next) => next();

/**
 * Scan one domain: stages 1 (tech) and 2 (signals) have no data dependency, so
 * they run concurrently; stage 3 (contact enrichment) needs stage 2's people,
 * so it follows. A Flue session runs one operation at a time, so each
 * concurrent `session.task` needs its own session — otherwise the second call
 * throws `SessionBusyError`. We open a uniquely-named session per branch; the
 * task still spawns an isolated child, so specialists never see the whole
 * batch, only their one-domain brief.
 */
async function scanDomain(
  harness: FlueHarness,
  domain: string,
  input: ProspectScanInput,
): Promise<DomainDossier> {
  const [techSession, scoutSession] = await Promise.all([
    harness.session(`scan:${domain}:tech`),
    harness.session(`scan:${domain}:scout`),
  ]);
  const [fingerprint, scout] = await Promise.all([
    techSession.task(buildTechBrief(domain), {
      agent: "techstack_prober",
      result: TechFingerprintSchema,
    }),
    scoutSession.task(buildScoutBrief(domain, input.vendorPersona), {
      agent: "signal_scout",
      result: SignalScoutResultSchema,
    }),
  ]);

  const candidates = scout.data.decisionMakers.slice(0, MAX_ENRICH_PER_DOMAIN);
  const decisionMakers = await Promise.all(
    candidates.map(async (person, index) => {
      const session = await harness.session(`scan:${domain}:enrich:${index}`);
      const enriched = await session.task(buildEnrichBrief(person, domain), {
        agent: "contact_enricher",
        result: EnrichedContactSchema,
      });
      return mergeContact(person, enriched.data);
    }),
  );

  return {
    domain,
    companyName: scout.data.companyName,
    fingerprint: fingerprint.data,
    signals: scout.data.signals,
    decisionMakers,
  };
}

export default defineWorkflow({
  agent: orchestrator,
  input: ProspectScanInputSchema,
  output: ProspectScanOutputSchema,
  async run({ harness, input }) {
    // Fan out across domains: every account scans in parallel. Each branch
    // opens its own session inside `scanDomain` (a session is single-op).
    const dossiers = await Promise.all(
      input.domains.map((domain) => scanDomain(harness, domain, input)),
    );

    // Stage 4: shard ranking — one Opus prompt per domain (judgment only), then
    // a tiny batch summary. A single batch synthesis stream was cut off by AI
    // Gateway ("Stream ended without finish_reason"); per-domain streams finish
    // reliably. `mergeRankings` rejoins evidence from dossiers by `domain`.
    const rankings = await Promise.all(
      dossiers.map(async (dossier) => {
        const session = await harness.session(`rank:${dossier.domain}`);
        const result = await session.prompt(
          buildPerDomainRankingBrief(input, dossier),
          { result: ProspectRankingSchema },
        );
        return result.data;
      }),
    );

    rankings.sort((a, b) => b.opportunityScore - a.opportunityScore);

    const summarySession = await harness.session("summary");
    const summaryResult = await summarySession.prompt(
      buildBatchSummaryBrief(input, rankings),
      { result: BatchSummarySchema },
    );

    return mergeRankings(dossiers, {
      rankings,
      summary: summaryResult.data.summary,
    });
  },
});
