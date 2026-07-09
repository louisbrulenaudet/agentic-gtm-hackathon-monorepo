// TEMPLATE: production flow shell. Copy, then replace AppNode/AppEdge + registry imports.
// Pairs with templates/node-data-types.ts, templates/edge-data-types.ts, examples/node-registry-pattern.ts.
// Read references/core-concepts.md + references/state-management-and-events.md before adapting.

import { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type IsValidConnection,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { AppNode, AppEdge } from '../types/flow';
import { nodeTypes, edgeTypes } from '../lib/flow/registry';

const initialNodes: AppNode[] = [];
const initialEdges: AppEdge[] = [];

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
};

// Enforce structural/business rules with drag feedback.
const isValidConnection: IsValidConnection = (c) => c.source !== c.target;

function FlowCanvas() {
  const [nodes, , onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: 'labeled' }, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={defaultEdgeOptions}
        colorMode="system"
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
        <Panel position="top-right">{/* toolbar / add-node menu */}</Panel>
      </ReactFlow>
    </div>
  );
}

// Provider wraps the canvas so toolbars/siblings can use React Flow hooks,
// and the parent enforces a real height.
export default function FlowShell() {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <FlowCanvas />
      </div>
    </ReactFlowProvider>
  );
}
