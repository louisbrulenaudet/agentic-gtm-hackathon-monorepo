import { queryOptions } from "@tanstack/react-query";
import { getRun } from "./run";

/**
 * Query options for a single Flue run record, keyed under the `flue` backend
 * namespace. Warmed in the run route loader and read with `useSuspenseQuery` in
 * the page (same object → one cache entry). Live events are streamed separately
 * (see `use-run-graph`), so this record is effectively static per run.
 */
export const runQueryOptions = (runId: string) =>
  queryOptions({
    queryKey: ["flue", "run", runId] as const,
    queryFn: () => getRun(runId),
  });
