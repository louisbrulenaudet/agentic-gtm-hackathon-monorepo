import type { NodeProps } from "@xyflow/react";
import { FlowNodeKind } from "@enums/flow-node-kind";
import type { AppNode } from "@/dtos/flow-graph";
import { NodeShell } from "./node-shell";

/** A tool call — native (`defineTool`) or MCP-served (`mcp__*`). */
export function ToolNode({ data, selected }: NodeProps<AppNode>) {
  const isMcp = data.kind === FlowNodeKind.MCP_TOOL;
  return (
    <NodeShell
      data={data}
      badge={isMcp ? "MC" : "TL"}
      accentClassName={
        isMcp
          ? "bg-fuchsia-500/20 text-fuchsia-300"
          : "bg-amber-500/20 text-amber-300"
      }
      selected={selected}
    />
  );
}
