# State Management & Events

**Covers:** change handlers, callback stability, where state should live, store boundaries, event orchestration, derived/computed state, and synchronization pitfalls.

**Read when:** wiring state, deciding local-state vs store, refactoring state ownership, handling selection/viewport events, or chasing stale-state / render-storm bugs.

## 1. Where should state live? (decision rule)

| Situation | Choice |
| --- | --- |
| Single flow, state used only inside the canvas subtree | `useNodesState` / `useEdgesState` (local) |
| Toolbar/sidebar siblings need to read/mutate the graph | lift state up + `<ReactFlowProvider>`, or a store |
| Cross-component access, undo/redo, server sync, large graph | **Zustand store** (React Flow's own recommendation) |
| Already on Redux/Jotai/etc. project-wide | match it; implement `onNodesChange` yourself with `applyNodeChanges` |

**Default:** local `useNodesState`/`useEdgesState`. **Do not introduce a state library unless the task needs one of the right-column triggers or the user asks.**

## 2. Custom store (when you outgrow local state)

React Flow recommends **Zustand**. The store owns `nodes`/`edges` and exposes the three handlers; `<ReactFlow>` reads from it.

```ts
// stores/flow-store.ts
import { create } from 'zustand';
import {
  applyNodeChanges, applyEdgeChanges, addEdge,
  type OnNodesChange, type OnEdgesChange, type OnConnect,
} from '@xyflow/react';
import type { AppNode, AppEdge } from '../types/flow';

type FlowState = {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (c) => set({ edges: addEdge(c, get().edges) }),
}));
```

Select narrowly (`useFlowStore(s => s.nodes)`), not the whole store, to avoid extra re-renders. See `examples/flow-state-store-example.ts`.

## 3. Callback stability

`<ReactFlow>` and node components re-render on prop identity changes. Stabilize:

- `onConnect`, `onNodesChange`, etc. → `useCallback` (or store actions, already stable).
- `nodeTypes`/`edgeTypes`/`defaultEdgeOptions` → module scope or `useMemo`.
- Callbacks passed **into node `data`** are an anti-pattern (breaks serialization + identity); instead use `updateNodeData`/store actions, or `useReactFlow()` inside the node.

## 4. Reading & updating from anywhere

`useReactFlow()` (inside provider) gives imperative access: `getNodes`, `getNode`, `setNodes`, `updateNode`, `updateNodeData`, `addNodes`, `deleteElements`, `fitView`, `screenToFlowPosition`. Prefer these over threading setters through props.

```tsx
const { updateNodeData, deleteElements } = useReactFlow();
updateNodeData(nodeId, { value });
deleteElements({ nodes: [{ id: nodeId }] });
```

## 5. Derived / computed state ("computing flows")

When a node's value depends on upstream nodes (calculators, dataflow):

- **Compute, don't duplicate.** Read upstream via `useNodesData(sourceIds)` (v12) inside the consuming node, or compute in a selector — don't copy upstream values into downstream `data` and try to keep them in sync.
- Connections drive the graph; use `useNodeConnections`/`useNodesData` to pull inputs reactively.
- See the computing-flows doc for the canonical pattern.

## 6. Events

- **Selection:** `useOnSelectionChange({ onChange })` or `onSelectionChange` prop — for a properties panel reflecting the selected node.
- **Viewport:** `useOnViewportChange` / `onMove` for minimap sync or persistence of pan/zoom.
- **Node/edge events:** `onNodeClick`, `onNodeDragStop`, `onEdgeClick`, `onPaneClick`, etc. Keep handlers stable and thin; dispatch to store/domain logic.

## 7. Synchronization pitfalls

- **Stale closures:** reading `nodes` from an outer scope inside a long-lived callback gives a stale snapshot. Use the functional updater (`setNodes(ns => ...)`) or `getNodes()` from `useReactFlow`.
- **Two sources of truth:** holding the graph in both local state and a store, or in `data` and elsewhere — pick one owner.
- **Mutating in place:** `node.data.x = 1` won't re-render and desyncs internals. Always produce new objects.
- **Render storms:** passing fresh object/array literals (`style={{...}}`, `data={{...}}`) every render defeats memoization — see [performance-and-scaling.md](./performance-and-scaling.md).

## Anti-patterns

- Reaching for Zustand/Redux on day one for a single static flow.
- Stuffing event callbacks into node `data`.
- Duplicating upstream values into downstream nodes instead of computing.
- Selecting the entire store object in every component.
- Mixing controlled props with `defaultNodes`/`defaultEdges`.

## Agent instructions

1. Determine the **current state owner** before editing; don't add a second source of truth.
2. Apply the §1 decision rule; if the project's state pattern is unclear and the change spans it, **ask**.
3. Prefer `useReactFlow()` imperative methods over prop-drilling setters.
4. For computed-value features, use `useNodesData`/`useNodeConnections`; never sync-copy data between nodes.
5. Stabilize every callback and the type registries before declaring a perf fix done.
