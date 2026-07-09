import type { NodeProps } from "@xyflow/react";
import type { AppNode } from "@/dtos/flow-graph";
import { NodeShell } from "./node-shell";

/** A delegated sub-agent (Flue `task`). */
export function SubagentNode({ data, selected }: NodeProps<AppNode>) {
  return (
    <NodeShell
      data={data}
      icon="🤖"
      accentClassName="bg-cyan-500/20 text-cyan-300"
      selected={selected}
    />
  );
}
