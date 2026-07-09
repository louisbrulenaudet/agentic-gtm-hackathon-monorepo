// flue-blueprint: tooling/vitest-evals@1
import { type AttachedAgentEvent, createFlueClient } from "@flue/sdk";
import {
  createHarness,
  toJsonValue,
  type SimpleHarnessResult,
  type TranscriptEvent,
} from "vitest-evals";

/**
 * Flue agent harness for `vitest-evals`.
 *
 * Prompts an HTTP-exposed Flue agent through `@flue/sdk`, live-tails its event
 * stream from the server-provided offset (filtered by `submissionId`, stopped
 * at the terminal `idle`), and normalizes the run into the transcript shape
 * `vitest-evals` expects — so `result.output`, `result.usage`, and
 * `toolCalls(result)` all work in eval cases. Each `run(...)` uses a fresh
 * instance id, so saved conversation history never leaks between cases.
 *
 * The blueprint's `SimpleToolCallRecord` result shape predates the installed
 * `vitest-evals@0.14.0`, which derives tool calls from transcript `tool_call` /
 * `tool_result` events instead; this harness emits those events directly.
 */
export interface FlueAgentHarnessOptions {
  agentName: string;
  baseUrl?: string;
  token?: string;
  headers?: Record<string, string>;
}

/** Map tool-call ids → normalized arguments seen on assistant `message_end`. */
function argumentsById(
  events: AttachedAgentEvent[],
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const event of events) {
    if (event.type !== "message_end" || event.message.role !== "assistant") {
      continue;
    }
    if (typeof event.message.content === "string") {
      continue;
    }
    for (const content of event.message.content) {
      if (content.type === "toolCall") {
        map.set(content.id, content.arguments);
      }
    }
  }
  return map;
}

/** Project Flue agent events into a `vitest-evals` transcript. */
function toTranscript(
  input: string,
  text: string,
  events: AttachedAgentEvent[],
): TranscriptEvent[] {
  const args = argumentsById(events);
  const transcript: TranscriptEvent[] = [
    { type: "message", role: "user", content: input },
  ];

  for (const event of events) {
    if (event.type !== "tool") {
      continue;
    }
    const rawArgs = toJsonValue(args.get(event.toolCallId));
    const toolArgs =
      rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)
        ? rawArgs
        : undefined;
    transcript.push({
      type: "tool_call",
      id: event.toolCallId,
      name: event.toolName,
      ...(toolArgs ? { arguments: toolArgs } : {}),
      durationMs: event.durationMs,
    });
    transcript.push({
      type: "tool_result",
      toolCallId: event.toolCallId,
      name: event.toolName,
      content: toJsonValue(event.result) ?? null,
      ...(event.isError
        ? { error: { message: `Tool ${event.toolName} returned an error` } }
        : {}),
    });
  }

  transcript.push({ type: "message", role: "assistant", content: text });
  return transcript;
}

/**
 * Read an env var without depending on `@types/node` (which would clash with
 * the Workers runtime globals this package is typed against). `process` exists
 * at runtime under the node-based eval runner.
 */
function readEnv(name: string): string | undefined {
  const proc = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process;
  return proc?.env?.[name];
}

export function createFlueAgentHarness(options: FlueAgentHarnessOptions) {
  // The Worker requires AGENT_API_KEY on /agents/*; the SDK's `token` becomes
  // an `Authorization: Bearer` header, which the guard accepts.
  const token = options.token ?? readEnv("AGENT_API_KEY");
  const client = createFlueClient({
    baseUrl:
      options.baseUrl ?? readEnv("FLUE_BASE_URL") ?? "http://127.0.0.1:3583",
    ...(token !== undefined ? { token } : {}),
    ...(options.headers !== undefined ? { headers: options.headers } : {}),
  });

  return createHarness<string, string>({
    name: `flue-${options.agentName}-agent`,
    run: async ({ input, signal }): Promise<SimpleHarnessResult<string>> => {
      const instanceId = `eval-${crypto.randomUUID()}`;
      const signalOption = signal ? { signal } : {};
      const invocation = await client.agents.prompt(
        options.agentName,
        instanceId,
        { message: input, ...signalOption },
      );

      const events: AttachedAgentEvent[] = [];
      for await (const event of client.agents.stream(
        options.agentName,
        instanceId,
        { offset: invocation.offset, ...signalOption },
      )) {
        if (event.submissionId !== invocation.submissionId) {
          continue;
        }
        events.push(event);
        if (event.type === "idle") {
          break;
        }
      }

      const { result } = invocation;
      const toolCallCount = events.filter((e) => e.type === "tool").length;

      return {
        output: result.text,
        events: toTranscript(input, result.text, events),
        usage: {
          provider: result.model.provider,
          model: result.model.id,
          inputTokens: result.usage.input,
          outputTokens: result.usage.output,
          totalTokens: result.usage.totalTokens,
          toolCalls: toolCallCount,
          metadata: {
            cacheReadTokens: result.usage.cacheRead,
            cacheWriteTokens: result.usage.cacheWrite,
            cost: result.usage.cost.total,
          },
        },
        metadata: {
          agent: options.agentName,
          instanceId,
          submissionId: invocation.submissionId,
        },
      };
    },
  });
}
