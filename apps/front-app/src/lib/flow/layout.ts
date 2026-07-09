import { graphlib, layout as dagreLayout } from "@dagrejs/dagre";
import { FlowNodeStatus } from "@enums/flow-node-status";
import type { AppEdge, AppNode } from "@/dtos/flow-graph";
import type { RunGraph } from "./event-graph";
import {
  computeNodeHeight,
  NODE_WIDTH,
  toAppEdge,
  toAppNode,
} from "./node-factory";

export interface LayoutedGraph {
  nodes: AppNode[];
  edges: AppEdge[];
}

/**
 * Sort nodes by first-seen time so Dagre sibling order stays stable across
 * updates.
 */
function compareNodes(
  a: RunGraph["nodes"][number],
  b: RunGraph["nodes"][number],
): number {
  const aTime = a.data.startedAt ?? 0;
  const bTime = b.data.startedAt ?? 0;
  if (aTime !== bTime) {
    return aTime - bTime;
  }
  return a.id.localeCompare(b.id);
}

function sortNodesForLayout(nodes: RunGraph["nodes"]): RunGraph["nodes"] {
  const result: RunGraph["nodes"] = [];
  for (const node of nodes) {
    let insertIndex = result.length;
    for (let i = 0; i < result.length; i++) {
      const existing = result[i];
      if (existing && compareNodes(node, existing) < 0) {
        insertIndex = i;
        break;
      }
    }
    result.splice(insertIndex, 0, node);
  }
  return result;
}

/**
 * Position a run graph left-to-right with Dagre and map it to React Flow
 * nodes/edges. Pure and synchronous — no React, no hooks — so it is safe to
 * call on every stream update. Edges whose target is still `RUNNING` are marked
 * `active` (animated).
 */
export function layoutRunGraph(graph: RunGraph): LayoutedGraph {
  const sortedNodes = sortNodesForLayout(graph.nodes);
  const dagre = new graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  dagre.setGraph({
    rankdir: "LR",
    nodesep: 72,
    ranksep: 128,
    edgesep: 24,
    ranker: "network-simplex",
    marginx: 24,
    marginy: 24,
  });

  for (const node of sortedNodes) {
    dagre.setNode(node.id, {
      width: NODE_WIDTH,
      height: computeNodeHeight(node.data),
    });
  }
  for (const edge of graph.edges) {
    dagre.setEdge(edge.source, edge.target);
  }

  dagreLayout(dagre);

  const statusByNodeId = new Map(
    graph.nodes.map((node) => [node.id, node.data.status]),
  );

  const nodes = sortedNodes.map((node) => {
    const positioned = dagre.node(node.id);
    // Dagre centers nodes; React Flow positions from the top-left corner.
    return toAppNode(node, {
      x: positioned.x - NODE_WIDTH / 2,
      y: positioned.y - computeNodeHeight(node.data) / 2,
    });
  });

  const edges = graph.edges.map((edge) =>
    toAppEdge(edge, statusByNodeId.get(edge.target) === FlowNodeStatus.RUNNING),
  );

  return { nodes, edges };
}
