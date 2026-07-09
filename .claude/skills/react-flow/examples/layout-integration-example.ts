// Dagre auto-layout — a PURE function (no React) you can unit-test and swap.
// Before modifying: read references/layout-and-positioning.md.
//
// Install: pnpm add @dagrejs/dagre
// Apply from a component AFTER nodes are measured (useNodesInitialized) then fitView().

import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'LR';

const FALLBACK_W = 172;
const FALLBACK_H = 36;

export function layoutWithDagre<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  direction: LayoutDirection = 'TB',
): N[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction });

  edges.forEach((e) => g.setEdge(e.source, e.target));
  nodes.forEach((n) =>
    g.setNode(n.id, {
      width: n.measured?.width ?? n.width ?? FALLBACK_W,
      height: n.measured?.height ?? n.height ?? FALLBACK_H,
    }),
  );

  Dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    const w = n.measured?.width ?? n.width ?? FALLBACK_W;
    const h = n.measured?.height ?? n.height ?? FALLBACK_H;
    // Dagre returns node centers; React Flow positions from the top-left.
    return { ...n, position: { x: pos.x - w / 2, y: pos.y - h / 2 } };
  });
}

// Component glue (sketch):
//   const nodesInitialized = useNodesInitialized();
//   const { fitView } = useReactFlow();
//   useEffect(() => {
//     if (!nodesInitialized) return;
//     setNodes((ns) => layoutWithDagre(ns, edges, 'TB'));
//     requestAnimationFrame(() => fitView());
//   }, [nodesInitialized]);
