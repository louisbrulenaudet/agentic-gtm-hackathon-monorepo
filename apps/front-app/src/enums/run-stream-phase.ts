/**
 * Lifecycle of the client-side connection to a Flue run's event stream.
 * Distinct from a node's status: this is the transport/run-level phase shown in
 * the run header. UI-only.
 */
export enum RunStreamPhase {
  /** Opening the stream; no event received yet. */
  CONNECTING = "connecting",
  /** Receiving events; the run has not emitted `run_end`. */
  STREAMING = "streaming",
  /** `run_end` received with no error. */
  COMPLETED = "completed",
  /** `run_end` errored, or the stream/connection itself failed. */
  ERRORED = "errored",
}
