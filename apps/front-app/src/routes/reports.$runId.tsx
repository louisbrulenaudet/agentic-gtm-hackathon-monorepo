import { runQueryOptions } from "@services/flue/run-query-options";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { RunIdSchema } from "@/dtos/run-id";

export const Route = createFileRoute("/reports/$runId")({
  loader: async ({ context: { queryClient }, params: { runId } }) => {
    if (!RunIdSchema.safeParse(runId).success) {
      throw notFound();
    }
    await queryClient.ensureQueryData(runQueryOptions(runId));
  },
});
