import type { NodeProps } from "@xyflow/react";
import type { AppNode } from "@/dtos/flow-graph";
import { NodeShell } from "./node-shell";

/** The workflow run itself — the graph root. */
export function WorkflowNode({ data, selected }: NodeProps<AppNode>) {
  return (
    <NodeShell
      data={data}
      icon="🧭"
      accentClassName="bg-indigo-500/20 text-indigo-300"
      selected={selected}
    />
  );
}
