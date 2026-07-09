import {
  defineWorkflow,
  type WorkflowRouteHandler,
  type WorkflowRunsHandler,
} from "@flue/runtime";

import orchestrator from "../agents/orchestrator";
import {
  EnrichContactsInputSchema,
  EnrichContactsOutputSchema,
  EnrichedContactSchema,
} from "../dtos";
import { buildContactTaskMessage } from "../lib/contact-task-message";

export const description =
  "Enriches a batch of named contacts (email + phone) via the contact_enricher subagent, one delegated task per contact run concurrently, each validated against a strict result schema.";

// Exposes POST /workflows/enrich-contacts. Hackathon: no auth guard, matching
// app.ts/sample-answer.ts — the browser SPA calls this Worker directly, and a
// strict CORS allowlist in app.ts is the boundary instead. Re-add
// `requireApiKey` here for any non-hackathon deployment.
export const route: WorkflowRouteHandler = async (_c, next) => next();

// Exposes GET /runs/:runId (metadata + event stream) for runs owned by this
// workflow — same hackathon pass-through as sample-answer.ts.
export const runs: WorkflowRunsHandler = async (_c, next) => next();

export default defineWorkflow({
  agent: orchestrator,
  input: EnrichContactsInputSchema,
  output: EnrichContactsOutputSchema,
  async run({ harness, input }) {
    // A Flue session runs one operation at a time, so fanning `task()` calls
    // out with `Promise.all` on a single session throws `SessionBusyError`.
    // Give each contact its own session; the task still spawns an isolated
    // child, so enrichment runs concurrently across the batch.
    const results = await Promise.all(
      input.contacts.map(async (contact, index) => {
        const session = await harness.session(`enrich:${index}`);
        return session.task(buildContactTaskMessage(contact), {
          agent: "contact_enricher",
          result: EnrichedContactSchema,
        });
      }),
    );

    return { contacts: results.map((result) => result.data) };
  },
});
