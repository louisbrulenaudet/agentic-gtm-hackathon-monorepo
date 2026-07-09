import { createFileRoute } from "@tanstack/react-router";

// Landing route: no data to load. The UI (a run-UUID lookup) lives in the
// paired `index.lazy.tsx`.
export const Route = createFileRoute("/")({});
