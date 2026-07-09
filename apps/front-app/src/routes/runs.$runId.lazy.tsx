import { RunGraphPage } from "@pages/RunGraphPage";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/runs/$runId")({
  component: RunGraphRoute,
});

function RunGraphRoute() {
  const { runId } = Route.useParams();
  return <RunGraphPage runId={runId} />;
}
