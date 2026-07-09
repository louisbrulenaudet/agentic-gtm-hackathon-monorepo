import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useRef } from "react";
import type { AppEdge, AppNode } from "@/dtos/flow-graph";
import { nodeTypes } from "./registry";

export type FlowCanvasProps = Readonly<{
  nodes: AppNode[];
  edges: AppEdge[];
}>;

const FIT_VIEW_OPTIONS = { padding: 0.24, duration: 400 } as const;

function FlowCanvasInner({
  nodes: derivedNodes,
  edges: derivedEdges,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(derivedEdges);
  const { fitView } = useReactFlow();
  const nodeCountRef = useRef(derivedNodes.length);

  // Project the stream-derived graph into the React Flow store. The Flue event
  // stream is the single source of truth for structure, status and position;
  // React Flow keeps only ephemeral interaction state (selection, viewport).
  // This synchronizes with an external store — not prop-into-state mirroring.
  useEffect(() => {
    setNodes(derivedNodes);
    setEdges(derivedEdges);
  }, [derivedNodes, derivedEdges, setNodes, setEdges]);

  // Re-frame the viewport whenever the graph grows so new nodes stay visible.
  useEffect(() => {
    if (derivedNodes.length === nodeCountRef.current) {
      return undefined;
    }
    nodeCountRef.current = derivedNodes.length;
    const handle = requestAnimationFrame(() => {
      void fitView(FIT_VIEW_OPTIONS);
    });
    return () => {
      cancelAnimationFrame(handle);
    };
  }, [derivedNodes.length, fitView]);

  return (
    <ReactFlow
      colorMode="dark"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodesDraggable={false}
      nodesConnectable={false}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      minZoom={0.2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={22} />
      <MiniMap pannable zoomable />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/**
 * Read-only React Flow canvas for a run's execution graph. Wrapped in its own
 * provider so `useReactFlow` (viewport framing) is available. Nodes/edges are
 * fully derived upstream from the event stream; this component only renders and
 * frames them.
 */
export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
