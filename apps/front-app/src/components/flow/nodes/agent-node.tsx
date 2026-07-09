import type { NodeProps } from "@xyflow/react";
import type { AppNode } from "@/dtos/flow-graph";
import { NodeShell } from "./node-shell";

/** The top-level orchestrator agent. */
export function AgentNode({ data, selected }: NodeProps<AppNode>) {
  return (
    <NodeShell
      data={data}
      badge="OR"
      accentClassName="bg-violet-500/20 text-violet-300"
      selected={selected}
    />
  );
}
