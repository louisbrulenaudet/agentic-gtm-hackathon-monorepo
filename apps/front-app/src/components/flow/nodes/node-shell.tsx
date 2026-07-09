import { FlowNodeStatus } from "@enums/flow-node-status";
import { Handle, Position } from "@xyflow/react";
import type { FlowNodeData } from "@/dtos/flow-graph";
import { formatDuration } from "@/lib/flow/summarize";

/** Border/ring per lifecycle status. */
const STATUS_RING: Record<FlowNodeStatus, string> = {
  [FlowNodeStatus.PENDING]: "border-slate-600/70",
  [FlowNodeStatus.RUNNING]: "border-sky-400/80",
  [FlowNodeStatus.SUCCEEDED]: "border-emerald-500/70",
  [FlowNodeStatus.FAILED]: "border-rose-500/80",
};

/** Status dot color; RUNNING pulses. */
const STATUS_DOT: Record<FlowNodeStatus, string> = {
  [FlowNodeStatus.PENDING]: "bg-slate-500",
  [FlowNodeStatus.RUNNING]: "bg-sky-400 animate-flow-pulse",
  [FlowNodeStatus.SUCCEEDED]: "bg-emerald-400",
  [FlowNodeStatus.FAILED]: "bg-rose-400",
};

export type NodeShellProps = Readonly<{
  data: FlowNodeData;
  /** Kind glyph shown in the header badge. */
  icon: string;
  /** Kind accent classes for the header badge. */
  accentClassName: string;
  selected?: boolean;
}>;

/**
 * Presentational shell shared by every run-graph node. Reads `data`, renders no
 * domain logic. Fills its React Flow wrapper (which is sized from the node's
 * `width`/`height`). Left target + right source handles suit the LR layout.
 */
export function NodeShell({
  data,
  icon,
  accentClassName,
  selected,
}: NodeShellProps) {
  return (
    <div
      className={`flow-node flex size-full flex-col gap-1 overflow-hidden rounded-xl border bg-slate-900/85 px-3 py-2.5 text-left shadow-lg backdrop-blur-sm ${STATUS_RING[data.status]} ${selected ? "ring-2 ring-indigo-400/60" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-md text-sm ${accentClassName}`}
          aria-hidden
        >
          {icon}
        </span>
        <span className="truncate text-sm font-semibold text-slate-100">
          {data.label}
        </span>
        <span
          className={`ml-auto size-2 shrink-0 rounded-full ${STATUS_DOT[data.status]}`}
          aria-hidden
        />
      </div>

      {data.subtitle ? (
        <span className="truncate text-[0.68rem] font-medium uppercase tracking-wide text-slate-400">
          {data.subtitle}
        </span>
      ) : null}

      {data.fields.length > 0 ? (
        <dl className="mt-0.5 flex min-h-0 flex-col gap-0.5 overflow-hidden text-[0.7rem] text-slate-300">
          {data.fields.slice(0, 2).map((entry) => (
            <div key={entry.label} className="flex gap-1 overflow-hidden">
              <dt className="shrink-0 text-slate-500">{entry.label}:</dt>
              <dd className="truncate text-slate-300">{entry.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {data.durationMs === undefined ? null : (
        <span className="mt-auto self-end text-[0.65rem] tabular-nums text-slate-500">
          {formatDuration(data.durationMs)}
        </span>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
