import type { AppEdge, AppNode } from "@/dtos/flow-graph";
import type { LogicalEdge, LogicalNode } from "./event-graph";

/**
 * Fixed node dimensions. Sizing nodes up front makes the Dagre layout
 * deterministic without waiting for DOM measurement (avoids the
 * `useNodesInitialized` round-trip and the "nodes overlap on first paint"
 * gotcha). Node components render at these dimensions.
 */
export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 104;

/** Map a logical node + computed position to a React Flow node. */
export function toAppNode(
  node: LogicalNode,
  position: { x: number; y: number },
): AppNode {
  return {
    id: node.id,
    type: node.data.kind,
    position,
    data: node.data,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };
}

/** Map a logical edge to a React Flow edge; `active` animates the dashes. */
export function toAppEdge(edge: LogicalEdge, active: boolean): AppEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    animated: active,
    data: { active },
  };
}
