import { FlowNodeStatus } from "@enums/flow-node-status";
import { useCallback, useEffect } from "react";
import type { AppNode } from "@/dtos/flow-graph";
import { formatDetailValue } from "@/lib/flow/format-detail";
import { formatDuration } from "@/lib/flow/summarize";

const STATUS_LABEL: Record<FlowNodeStatus, string> = {
  [FlowNodeStatus.PENDING]: "En attente",
  [FlowNodeStatus.RUNNING]: "En cours",
  [FlowNodeStatus.SUCCEEDED]: "Réussi",
  [FlowNodeStatus.FAILED]: "Échec",
};

const STATUS_CLASS: Record<FlowNodeStatus, string> = {
  [FlowNodeStatus.PENDING]: "text-slate-400",
  [FlowNodeStatus.RUNNING]: "text-sky-300",
  [FlowNodeStatus.SUCCEEDED]: "text-emerald-300",
  [FlowNodeStatus.FAILED]: "text-rose-300",
};

export type NodeDetailPanelProps = Readonly<{
  node: AppNode | undefined;
  onClose: () => void;
}>;

async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Right-hand drawer showing full payloads for a selected graph node. */
export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleCopy = useCallback((value: unknown) => {
    void copyToClipboard(formatDetailValue(value));
  }, []);

  if (!node) {
    return null;
  }

  const { data } = node;
  const sections =
    data.detailSections.length > 0
      ? data.detailSections
      : data.fields.map((entry) => ({
          label: entry.label,
          value: entry.value,
        }));

  return (
    <aside
      className="absolute inset-y-0 right-0 z-20 flex w-[min(100%,380px)] flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-sm"
      aria-label="Détail du nœud"
    >
      <header className="flex shrink-0 items-start gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">
            {data.label}
          </p>
          {data.description ? (
            <p className="mt-0.5 text-xs text-slate-400">{data.description}</p>
          ) : null}
          <p
            className={`mt-1 text-xs font-medium ${STATUS_CLASS[data.status]}`}
          >
            {STATUS_LABEL[data.status]}
            {data.durationMs !== undefined
              ? ` · ${formatDuration(data.durationMs)}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-white/10 hover:text-slate-200"
          aria-label="Fermer le panneau"
        >
          ×
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {sections.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun détail disponible.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sections.map((section) => (
              <details
                key={section.label}
                open
                className="rounded-lg border border-white/10 bg-slate-900/60"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <span>{section.label}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleCopy(section.value);
                    }}
                    className="rounded px-1.5 py-0.5 text-[0.65rem] normal-case tracking-normal text-slate-500 hover:bg-white/10 hover:text-slate-300"
                  >
                    Copier JSON
                  </button>
                </summary>
                <pre className="max-h-64 overflow-auto border-t border-white/5 px-3 py-2 text-[0.68rem] leading-relaxed text-slate-300">
                  {formatDetailValue(section.value)}
                </pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
