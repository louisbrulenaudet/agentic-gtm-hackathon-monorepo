// Zustand flow store — use ONLY when state outgrows the component (cross-component
// access, undo/redo, server sync). For a single flow, prefer useNodesState/useEdgesState.
// Before modifying: read references/state-management-and-events.md.

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { AppNode, AppEdge } from './node-data-types-placeholder'; // -> your types/flow.ts

type FlowState = {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
  updateNodeValue: (id: string, value: string) => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  // The store owns the three controlled handlers; <ReactFlow> reads from it.
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  // Domain action: patch a single node immutably.
  updateNodeValue: (id, value) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, value } } : n,
      ),
    }),
}));

// USAGE — select narrowly to avoid re-rendering on every node tick:
//   const nodes = useFlowStore((s) => s.nodes);
//   const onConnect = useFlowStore((s) => s.onConnect);
// AVOID:  const store = useFlowStore();  // subscribes to everything
