import { runQueryOptions } from "@services/flue/run-query-options";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { RunIdSchema } from "@/dtos/run-id";

/**
 * Eager route shell for `/runs/$runId`: validates the UUID param and warms the
 * run record in the Query cache so the page can read it with `useSuspenseQuery`
 * without suspending. The live event graph is streamed separately in the page.
 */
export const Route = createFileRoute("/runs/$runId")({
  loader: async ({ context: { queryClient }, params: { runId } }) => {
    if (!RunIdSchema.safeParse(runId).success) {
      throw notFound();
    }
    await queryClient.ensureQueryData(runQueryOptions(runId));
  },
});
