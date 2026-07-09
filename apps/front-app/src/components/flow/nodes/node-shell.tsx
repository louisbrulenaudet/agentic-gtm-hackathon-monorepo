import { FlowNodeStatus } from "@enums/flow-node-status";
import { Handle, Position } from "@xyflow/react";
import type { FlowNodeData } from "@/dtos/flow-graph";
import { buildNodeTooltip } from "@/lib/flow/preview";
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

const MAX_VISIBLE_PREVIEWS = 3;

export type NodeShellProps = Readonly<{
  data: FlowNodeData;
  /** Two-letter kind badge shown in the header. */
  badge: string;
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
  badge,
  accentClassName,
  selected,
}: NodeShellProps) {
  const previewSource =
    data.previewFields.length > 0 ? data.previewFields : data.fields;
  const visiblePreviews = previewSource.slice(0, MAX_VISIBLE_PREVIEWS);
  const tooltip = buildNodeTooltip(data.description, visiblePreviews);
  const hasErrorPreview = visiblePreviews.some(
    (entry) => entry.label === "error" || entry.label === "erreur",
  );

  return (
    <div
      className={`flow-node group relative flex size-full min-h-0 cursor-pointer flex-col gap-1 overflow-hidden rounded-xl border bg-slate-900/85 px-3 py-2.5 text-left shadow-lg backdrop-blur-sm ${STATUS_RING[data.status]} ${selected ? "ring-2 ring-indigo-400/60" : ""}`}
      title={tooltip}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[0.6rem] font-bold tracking-tight ${accentClassName}`}
          aria-hidden
        >
          {badge}
        </span>
        <span className="truncate text-sm font-semibold text-slate-100">
          {data.label}
        </span>
        <span
          className={`ml-auto size-2 shrink-0 rounded-full ${STATUS_DOT[data.status]}`}
          aria-hidden
        />
      </div>

      {data.description ? (
        <span className="shrink-0 truncate text-[0.68rem] text-slate-400">
          {data.description}
        </span>
      ) : data.subtitle ? (
        <span className="shrink-0 truncate text-[0.68rem] font-medium uppercase tracking-wide text-slate-400">
          {data.subtitle}
        </span>
      ) : null}

      {visiblePreviews.length > 0 ? (
        <dl className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden text-[0.7rem] text-slate-300">
          {visiblePreviews.map((entry) => (
            <div
              key={entry.label}
              className="flex min-h-0 gap-1 overflow-hidden"
            >
              <dt className="shrink-0 text-slate-500">{entry.label}:</dt>
              <dd
                className={`line-clamp-2 min-w-0 ${
                  entry.label === "error" || entry.label === "erreur"
                    ? "text-rose-300"
                    : "text-slate-300"
                }`}
              >
                {entry.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {data.status === FlowNodeStatus.FAILED && !hasErrorPreview ? (
        <span className="text-[0.68rem] text-rose-300">
          Échec — voir détail
        </span>
      ) : null}

      {data.durationMs === undefined ? null : (
        <span className="mt-auto self-end text-[0.65rem] tabular-nums text-slate-500">
          {formatDuration(data.durationMs)}
        </span>
      )}

      {tooltip ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-[280px] -translate-x-1/2 rounded-lg border border-slate-600/80 bg-slate-950/95 px-2.5 py-2 text-[0.68rem] leading-snug text-slate-200 shadow-xl group-hover:block motion-reduce:group-hover:block"
        >
          {tooltip.split("\n").map((line) => (
            <p key={line} className="truncate">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
