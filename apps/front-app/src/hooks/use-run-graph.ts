import type { RunStreamPhase } from "@enums/run-stream-phase";
import type { AppEdge, AppNode } from "@/dtos/flow-graph";
import { buildGraphFromEvents } from "@/lib/flow/event-graph";
import { layoutRunGraph } from "@/lib/flow/layout";
import { useFlueRunStream } from "./use-flue-run-stream";

export interface RunGraphState {
  nodes: AppNode[];
  edges: AppEdge[];
  phase: RunStreamPhase;
  result?: unknown;
  error?: string;
  eventCount: number;
}

/**
 * Subscribe to a run's live event stream and derive the positioned React Flow
 * graph from it. The build + layout are pure functions of the event list, so
 * (with the React Compiler) they recompute only when a new event arrives.
 */
export function useRunGraph(runId: string): RunGraphState {
  const { events, phase, result, error } = useFlueRunStream(runId);
  const { nodes, edges } = layoutRunGraph(buildGraphFromEvents(events));
  return { nodes, edges, phase, result, error, eventCount: events.length };
}
