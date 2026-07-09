import {
  defineWorkflow,
  type WorkflowRouteHandler,
  type WorkflowRunsHandler,
} from "@flue/runtime";

import orchestrator from "../agents/orchestrator";
import { SampleAnswerSchema, SampleQuestionSchema } from "../dtos";
import { requireApiKey } from "../middlewares/require-api-key";
import brief from "./sample-answer.md" with { type: "markdown" };

export const description =
  "Lorem ipsum workflow: runs the orchestrator agent and validates its output against the sample answer schema.";

// Exposes POST /workflows/sample-answer. Auth is enforced app-wide by the
// AGENT_API_KEY guard on `/workflows/*` in app.ts, so invocation stays a
// pass-through here.
export const route: WorkflowRouteHandler = async (_c, next) => next();

// Exposes GET /runs/:runId for runs owned by this workflow (without this
// export Flue returns a generic 404). `/runs/*` is not covered by the app.ts
// prefixes, so the guard is applied here — the documented per-workflow
// exposure point.
export const runs: WorkflowRunsHandler = requireApiKey;

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
