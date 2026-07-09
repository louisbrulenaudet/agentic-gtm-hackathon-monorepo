// TEMPLATE: edge types (co-locate in types/flow.ts).
// Read references/edges.md before adapting.

import type { Edge } from '@xyflow/react';

export type LabeledEdgeData = { label?: string };
export type LabeledEdge = Edge<LabeledEdgeData, 'labeled'>;

// Include the built-in Edge so default edges remain valid in the union.
export type AppEdge = LabeledEdge | Edge;

// Usage:
//   const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initial);
//   function EdgeC(props: EdgeProps<LabeledEdge>) { /* props.data: LabeledEdgeData */ }
