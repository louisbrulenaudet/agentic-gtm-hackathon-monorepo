import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeMouseHandler,
  type OnNodeDrag,
} from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import type { AppEdge, AppNode } from "@/dtos/flow-graph";
import { nodeTypes } from "./registry";

export type FlowCanvasProps = Readonly<{
  nodes: AppNode[];
  edges: AppEdge[];
  selectedNodeId?: string;
  onNodeSelect?: (nodeId: string | undefined) => void;
}>;

const FIT_VIEW_OPTIONS = { padding: 0.24, duration: 400 } as const;

function FlowCanvasInner({
  nodes: derivedNodes,
  edges: derivedEdges,
  selectedNodeId,
  onNodeSelect,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(derivedEdges);
  const { fitView } = useReactFlow();
  const nodeCountRef = useRef(derivedNodes.length);

  const onNodeDragStop = useCallback<OnNodeDrag<AppNode>>(
    (_event, node) => {
      setNodes((current) =>
        current.map((entry) =>
          entry.id === node.id
            ? {
                ...entry,
                position: node.position,
                data: { ...entry.data, userPositioned: true },
              }
            : entry,
        ),
      );
    },
    [setNodes],
  );

  const onNodeClick = useCallback<NodeMouseHandler<AppNode>>(
    (_event, node) => {
      onNodeSelect?.(node.id);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(undefined);
  }, [onNodeSelect]);

  // Project the stream-derived graph into the React Flow store. Dagre positions
  // apply on every update unless the user dragged a node this session.
  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((node) => [node.id, node]));
      return derivedNodes.map((derived) => {
        const existing = currentById.get(derived.id);
        const selected = derived.id === selectedNodeId;
        if (existing?.data.userPositioned) {
          return {
            ...derived,
            position: existing.position,
            selected,
            data: { ...derived.data, userPositioned: true },
          };
        }
        return { ...derived, selected };
      });
    });
    setEdges(derivedEdges);
  }, [derivedNodes, derivedEdges, selectedNodeId, setNodes, setEdges]);

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
      className="size-full"
      colorMode="dark"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={onNodeDragStop}
      nodesDraggable
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
 * Read-only structure, draggable layout. Wrapped in its own provider so
 * `useReactFlow` (viewport framing) is available. Nodes/edges are derived
 * upstream from the event stream; dragged positions persist for the session.
 */
export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <div className="size-full">
        <FlowCanvasInner {...props} />
      </div>
    </ReactFlowProvider>
  );
}
