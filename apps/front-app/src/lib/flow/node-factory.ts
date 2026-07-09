import { FlowNodeStatus } from "@enums/flow-node-status";
import type { AppEdge, AppNode, FlowNodeData } from "@/dtos/flow-graph";
import type { LogicalEdge, LogicalNode } from "./event-graph";

/**
 * Fixed node width. Height is computed per node from its content so Dagre
 * layout stays deterministic without DOM measurement.
 */
export const NODE_WIDTH = 260;

const NODE_HEIGHT_BASE = 76;
const NODE_HEIGHT_DESCRIPTION = 18;
const NODE_HEIGHT_SUBTITLE = 16;
const NODE_HEIGHT_FIELD = 22;
const NODE_HEIGHT_DURATION = 16;
const NODE_HEIGHT_ERROR = 14;
const NODE_HEIGHT_MIN = 96;
const NODE_HEIGHT_MAX = 220;
const MAX_VISIBLE_PREVIEWS = 3;

/** Compute node height from the data that will be rendered in NodeShell. */
export function computeNodeHeight(data: FlowNodeData): number {
  const previewSource =
    data.previewFields.length > 0 ? data.previewFields : data.fields;
  const fieldCount = Math.min(previewSource.length, MAX_VISIBLE_PREVIEWS);
  let height = NODE_HEIGHT_BASE;
  if (data.description) {
    height += NODE_HEIGHT_DESCRIPTION;
  } else if (data.subtitle) {
    height += NODE_HEIGHT_SUBTITLE;
  }
  height += fieldCount * NODE_HEIGHT_FIELD;
  if (
    data.status === FlowNodeStatus.FAILED &&
    !previewSource.some(
      (entry) => entry.label === "error" || entry.label === "erreur",
    )
  ) {
    height += NODE_HEIGHT_ERROR;
  }
  if (data.durationMs !== undefined) {
    height += NODE_HEIGHT_DURATION;
  }
  return Math.min(NODE_HEIGHT_MAX, Math.max(NODE_HEIGHT_MIN, height));
}

/** Map a logical node + computed position to a React Flow node. */
export function toAppNode(
  node: LogicalNode,
  position: { x: number; y: number },
): AppNode {
  const height = computeNodeHeight(node.data);
  return {
    id: node.id,
    type: node.data.kind,
    position,
    data: node.data,
    width: NODE_WIDTH,
    height,
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
