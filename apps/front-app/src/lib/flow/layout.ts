import { graphlib, layout as dagreLayout } from "@dagrejs/dagre";
import { FlowNodeStatus } from "@enums/flow-node-status";
import type { AppEdge, AppNode } from "@/dtos/flow-graph";
import type { RunGraph } from "./event-graph";
import { NODE_HEIGHT, NODE_WIDTH, toAppEdge, toAppNode } from "./node-factory";

export interface LayoutedGraph {
  nodes: AppNode[];
  edges: AppEdge[];
}

/**
 * Position a run graph left-to-right with Dagre and map it to React Flow
 * nodes/edges. Pure and synchronous — no React, no hooks — so it is safe to
 * call on every stream update. Edges whose target is still `RUNNING` are marked
 * `active` (animated).
 */
export function layoutRunGraph(graph: RunGraph): LayoutedGraph {
  const dagre = new graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  dagre.setGraph({
    rankdir: "LR",
    nodesep: 36,
    ranksep: 96,
    marginx: 24,
    marginy: 24,
  });

  for (const node of graph.nodes) {
    dagre.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of graph.edges) {
    dagre.setEdge(edge.source, edge.target);
  }

  dagreLayout(dagre);

  const statusByNodeId = new Map(
    graph.nodes.map((node) => [node.id, node.data.status]),
  );

  const nodes = graph.nodes.map((node) => {
    const positioned = dagre.node(node.id);
    // Dagre centers nodes; React Flow positions from the top-left corner.
    return toAppNode(node, {
      x: positioned.x - NODE_WIDTH / 2,
      y: positioned.y - NODE_HEIGHT / 2,
    });
  });

  const edges = graph.edges.map((edge) =>
    toAppEdge(edge, statusByNodeId.get(edge.target) === FlowNodeStatus.RUNNING),
  );

  return { nodes, edges };
}
