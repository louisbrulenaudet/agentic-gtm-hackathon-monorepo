import { RunStreamPhase } from "@enums/run-stream-phase";
import { useRunGraph } from "@hooks/use-run-graph";
import { runQueryOptions } from "@services/flue/run-query-options";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FlowCanvas } from "@/components/flow/flow-canvas";
import { NodeDetailPanel } from "@/components/flow/node-detail-panel";

const PHASE_META: Record<RunStreamPhase, { label: string; className: string }> =
  {
    [RunStreamPhase.CONNECTING]: {
      label: "Connecting",
      className: "bg-slate-600/40 text-slate-300",
    },
    [RunStreamPhase.STREAMING]: {
      label: "Streaming",
      className: "bg-sky-500/20 text-sky-300",
    },
    [RunStreamPhase.COMPLETED]: {
      label: "Completed",
      className: "bg-emerald-500/20 text-emerald-300",
    },
    [RunStreamPhase.ERRORED]: {
      label: "Errored",
      className: "bg-rose-500/20 text-rose-300",
    },
  };

export type RunGraphPageProps = Readonly<{ runId: string }>;

/**
 * Full-screen visualization of one run: a header (workflow, id, live phase,
 * event count) over the React Flow canvas fed by the live event stream.
 */
export function RunGraphPage({ runId }: RunGraphPageProps) {
  const { data: run } = useSuspenseQuery(runQueryOptions(runId));
  const { nodes, edges, phase, error, eventCount } = useRunGraph(runId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const phaseMeta = PHASE_META[phase];

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 bg-slate-950/80 px-5 py-3">
        <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
          ← runs
        </Link>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-slate-100">
            {run.workflowName}
          </span>
          <span className="truncate font-mono text-xs text-slate-500">
            {runId}
          </span>
        </div>
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${phaseMeta.className}`}
        >
          {phaseMeta.label}
        </span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs tabular-nums text-slate-400">
          {eventCount} events
        </span>
        <Link
          to="/reports/$runId"
          params={{ runId }}
          className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-200 hover:bg-orange-500/25"
        >
          report
        </Link>
      </header>

      <div className="relative min-h-0 flex-1">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />

        <NodeDetailPanel
          node={selectedNode}
          onClose={() => {
            setSelectedNodeId(undefined);
          }}
        />

        {nodes.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-lg bg-slate-900/80 px-4 py-2 text-sm text-slate-400">
              {phase === RunStreamPhase.CONNECTING
                ? "Connecting to the run stream…"
                : "Waiting for the first event…"}
            </p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="absolute inset-x-4 bottom-4 rounded-lg border border-rose-500/40 bg-rose-950/70 px-4 py-2 text-sm text-rose-200"
          >
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
