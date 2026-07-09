import type { RunRecord } from "@flue/sdk";
import { flueClient } from "@/config/flue-client";

/**
 * Fetch a single workflow-run record (metadata + status) by its UUID via the
 * Flue SDK. Live events come from the stream hook; this is the one-shot record
 * used to warm the run route and validate that a UUID exists.
 */
export async function getRun(runId: string): Promise<RunRecord> {
  return flueClient.runs.get(runId);
}
