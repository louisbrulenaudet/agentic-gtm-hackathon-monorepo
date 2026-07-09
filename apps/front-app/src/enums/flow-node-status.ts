/**
 * Lifecycle status of a run-graph node, derived from Flue `*_start` / settled
 * events. Drives node styling (ring, pulse) and edge animation. UI-only.
 */
export enum FlowNodeStatus {
  /** Created but not yet started. */
  PENDING = "pending",
  /** Started, no terminal event seen yet. */
  RUNNING = "running",
  /** Settled successfully. */
  SUCCEEDED = "succeeded",
  /** Settled with an error. */
  FAILED = "failed",
}
