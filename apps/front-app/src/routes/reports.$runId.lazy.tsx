import { RunReportPage } from "@pages/RunReportPage";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/reports/$runId")({
  component: RunReportRoute,
});

function RunReportRoute() {
  const { runId } = Route.useParams();
  return <RunReportPage runId={runId} />;
}
