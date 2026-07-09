import * as v from "valibot";

/**
 * Schemas for the sample-answer workflow's typed input and structured result.
 *
 * These use valibot (not the repo's Zod standard) because Flue's `input` /
 * `result` / `output` schema slots are valibot-typed and its runtime validates
 * through the Standard Schema interface. They are Flue-internal contracts and
 * never cross an app HTTP/wire boundary, so the rest of the app stays on Zod.
 */
export const SampleQuestionSchema = v.object({
  question: v.pipe(
    v.string(),
    v.minLength(1, "A non-empty question is required."),
    v.maxLength(4000),
    v.description("Lorem ipsum dolor sit amet, consectetur adipiscing elit."),
  ),
});

export const SampleSourceSchema = v.object({
  reference: v.pipe(
    v.string(),
    v.description(
      "Lorem ipsum reference identifier (e.g. doc-42, section-alpha).",
    ),
  ),
  excerpt: v.pipe(
    v.optional(v.string()),
    v.description("Short lorem ipsum excerpt supporting the answer."),
  ),
});

export const SampleAnswerSchema = v.object({
  answer: v.pipe(
    v.string(),
    v.description("The synthesized lorem ipsum answer, in Markdown."),
  ),
  sources: v.pipe(
    v.array(SampleSourceSchema),
    v.description(
      "Citations that ground the answer; empty if none were found.",
    ),
  ),
});

export type SampleQuestion = v.InferOutput<typeof SampleQuestionSchema>;
export type SampleSource = v.InferOutput<typeof SampleSourceSchema>;
export type SampleAnswer = v.InferOutput<typeof SampleAnswerSchema>;
