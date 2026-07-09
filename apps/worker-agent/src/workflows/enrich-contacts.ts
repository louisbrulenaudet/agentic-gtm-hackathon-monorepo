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
    const session = await harness.session();

    // Each `task()` call starts its own independent child session (see
    // `contact_enricher`'s own instructions for what it does with it), so
    // fanning them out with `Promise.all` enriches every contact in the
    // batch concurrently rather than one at a time.
    const results = await Promise.all(
      input.contacts.map((contact) =>
        session.task(buildContactTaskMessage(contact), {
          agent: "contact_enricher",
          result: EnrichedContactSchema,
        }),
      ),
    );

    return { contacts: results.map((result) => result.data) };
  },
});
