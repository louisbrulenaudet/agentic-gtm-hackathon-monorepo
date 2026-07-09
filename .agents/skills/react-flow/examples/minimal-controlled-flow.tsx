// Minimal controlled flow — the canonical interactive starter.
// Before modifying: read references/core-concepts.md and references/setup-and-installation.md.
//
// Demonstrates the three non-negotiables: CSS import, sized wrapper, unique string IDs;
// and the controlled-state contract (useNodesState / useEdgesState / onConnect + addEdge).

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: 'b', position: { x: 0, y: 120 }, data: { label: 'End' } },
];

const initialEdges: Edge[] = [{ id: 'a-b', source: 'a', target: 'b' }];

// Module scope: stable identity, applied to newly-created edges by addEdge.
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
};

export default function MinimalControlledFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    // Wrapper MUST have explicit dimensions or the canvas collapses to 0px.
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
