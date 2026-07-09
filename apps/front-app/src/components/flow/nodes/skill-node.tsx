import type { NodeProps } from "@xyflow/react";
import type { AppNode } from "@/dtos/flow-graph";
import { NodeShell } from "./node-shell";

/** A Flue skill invocation (`operationKind: skill` or `activate_skill`). */
export function SkillNode({ data, selected }: NodeProps<AppNode>) {
  return (
    <NodeShell
      data={data}
      badge="SK"
      accentClassName="bg-violet-500/20 text-violet-300"
      selected={selected}
    />
  );
}
