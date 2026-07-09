import type { FlueClient, FlueEvent } from "@flue/sdk";
import { RunStreamPhase } from "@enums/run-stream-phase";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { flueClient } from "@/config/flue-client";
import { summarizeValue } from "@/lib/flow/summarize";

export interface RunStreamSnapshot {
  /** All events received so far, in order (immutable — a new array per update). */
  events: readonly FlueEvent[];
  phase: RunStreamPhase;
  /** Terminal workflow result, once `run_end` arrives without error. */
  result?: unknown;
  /** Human-readable error, from a failed run or a transport failure. */
  error?: string;
}

interface RunStreamStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => RunStreamSnapshot;
  start: () => void;
  destroy: () => void;
}

/**
 * A per-run event-stream store consumed via `useSyncExternalStore`. Wraps the
 * `@flue/sdk` async-iterable run stream (SSE, full history via `offset: "-1"`)
 * so a completed run replays and an in-progress run tails live until `run_end`.
 * `start`/`destroy` own the connection lifecycle (driven by an effect);
 * `subscribe` only relays change notifications.
 */
function createRunStreamStore(
  client: FlueClient,
  runId: string,
): RunStreamStore {
  const listeners = new Set<() => void>();
  let events: readonly FlueEvent[] = [];
  let snapshot: RunStreamSnapshot = {
    events,
    phase: RunStreamPhase.CONNECTING,
  };
  let controller: AbortController | undefined;
  let running = false;

  function publish(patch: Partial<Omit<RunStreamSnapshot, "events">>): void {
    snapshot = { ...snapshot, ...patch, events };
    for (const listener of listeners) {
      listener();
    }
  }

  async function consume(signal: AbortSignal): Promise<void> {
    try {
      const stream = client.runs.stream(runId, {
        live: "sse",
        offset: "-1",
        signal,
      });
      for await (const event of stream) {
        // New array each event so downstream memoization recomputes the graph.
        events = events.concat(event);
        if (event.type === "run_end") {
          publish({
            phase: event.isError
              ? RunStreamPhase.ERRORED
              : RunStreamPhase.COMPLETED,
            result: event.isError ? undefined : event.result,
            error: event.isError
              ? summarizeValue(event.error) || "Run failed."
              : undefined,
          });
          return;
        }
        publish({ phase: RunStreamPhase.STREAMING });
      }
    } catch (cause) {
      if (signal.aborted) {
        return;
      }
      publish({
        phase: RunStreamPhase.ERRORED,
        error: cause instanceof Error ? cause.message : "Event stream failed.",
      });
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    start() {
      if (running) {
        return;
      }
      running = true;
      controller = new AbortController();
      void consume(controller.signal);
    },
    destroy() {
      controller?.abort();
      controller = undefined;
      running = false;
      events = [];
      snapshot = { events, phase: RunStreamPhase.CONNECTING };
    },
  };
}

/**
 * Subscribe to a Flue run's live event stream by its UUID. Returns the current
 * snapshot (events + phase + result/error); re-renders on each event.
 */
export function useFlueRunStream(runId: string): RunStreamSnapshot {
  // One stable store per runId. Recreating it re-runs the effect below, which
  // is self-healing (idempotent start + resetting destroy).
  const store = useMemo(() => createRunStreamStore(flueClient, runId), [runId]);

  useEffect(() => {
    store.start();
    return () => {
      store.destroy();
    };
  }, [store]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
