import {
  defineWorkflow,
  type WorkflowRouteHandler,
  type WorkflowRunsHandler,
} from "@flue/runtime";

import orchestrator from "../agents/orchestrator";
import { SampleAnswerSchema, SampleQuestionSchema } from "../dtos";
import brief from "./sample-answer.md" with { type: "markdown" };

export const description =
  "Lorem ipsum workflow: runs the orchestrator agent and validates its output against the sample answer schema.";

// Exposes POST /workflows/sample-answer. Auth is enforced app-wide by the
// AGENT_API_KEY guard on `/workflows/*` in app.ts, so invocation stays a
// pass-through here.
export const route: WorkflowRouteHandler = async (_c, next) => next();

// Exposes GET /runs/:runId (metadata + event stream) for runs owned by this
// workflow (without this export Flue returns a generic 404). Hackathon: it is a
// pass-through with no auth so the browser SPA can read and SSE-stream a run
// directly; re-add `requireApiKey` here for any non-hackathon deployment.
export const runs: WorkflowRunsHandler = async (_c, next) => next();

export default defineWorkflow({
  agent: orchestrator,
  input: SampleQuestionSchema,
  output: SampleAnswerSchema,
  async run({ harness, input }) {
    const session = await harness.session();
    const response = await session.prompt(`${brief}\n${input.question}`, {
      result: SampleAnswerSchema,
    });

    return response.data;
  },
});
