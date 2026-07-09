# Core Concepts

**Covers:** the minimum conceptual model an agent must preserve — nodes, edges, IDs, data payloads, type registries, the controlled-state contract, and the viewport.

**Read when:** explaining architecture, bootstrapping, or before any change that touches how state flows.

## 1. The objects

**Node** — minimally `{ id, position: { x, y }, data }`. Common fields: `type` (registry key; default `'default'`), `data` (your payload), plus `selected`, `dragging`, `width`/`height` (measured), `parentId` (sub-flows), `hidden`, `draggable`, `selectable`, `connectable`.

**Edge** — minimally `{ id, source, target }` where `source`/`target` are node IDs. Common fields: `type` (registry key), `sourceHandle`/`targetHandle` (when a node has multiple handles), `data`, `label`, `markerEnd`, `animated`, `selected`.

**Handle** — the connection point on a node (`type: 'source' | 'target'`, a `position`, optional `id`). Custom nodes that participate in connections **must render `<Handle />`** — see [handles-and-connection-rules.md](./handles-and-connection-rules.md).

## 2. IDs

- Strings, unique within their collection, **stable across renders**.
- Generate with a real id source (`crypto.randomUUID()`, `nanoid`, or a monotonic counter you own) — never array index, never `Math.random()` recomputed each render.
- `edge.source`/`edge.target` must reference existing node IDs; `sourceHandle`/`targetHandle` must match a rendered handle `id`.

## 3. `data` is your domain payload

`data` is opaque to React Flow — it's where your app's per-node state lives (label, value, config). Rules:

- **Type it** (discriminated union by `type`) — see template `node-data-types.ts`.
- Keep it **JSON-serializable** if graphs are persisted/restored: no functions, class instances, DOM nodes, or non-clonable values.
- Treat it **immutably**: to update, produce a new node object with new `data` (via `setNodes(ns => ns.map(...))`), never mutate in place.

## 4. The controlled-state contract (the core model)

React Flow is controlled by default. You own the arrays; React Flow tells you how they should change:

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
const onConnect = useCallback(
  (c: Connection) => setEdges(eds => addEdge(c, eds)),
  [setEdges],
);

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}   // applies drag/select/remove/dimension changes
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}           // creates edges on user connect
/>
```

- `useNodesState`/`useEdgesState` are convenience wrappers; under the hood `onNodesChange` applies a `NodeChange[]` via `applyNodeChanges`. For custom state (a store), implement the handler yourself with `applyNodeChanges` / `applyEdgeChanges`.
- **Dropping a change handler** = drag/select/delete silently stop working. **Mutating arrays directly** = React doesn't re-render and internals desync.
- `addEdge(connection, edges)` returns a new array with the validated edge appended — use it in `onConnect`.

There is also an **uncontrolled** mode (`defaultNodes`/`defaultEdges`) for read-mostly flows; default to controlled unless the flow is static (see the uncontrolled-flow doc).

## 5. Type registries

`nodeTypes` / `edgeTypes` map a type string to a component. **Define at module scope** (or `useMemo` with stable deps) so React Flow doesn't remount everything each render:

```ts
// lib/flow/registry.ts
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { TextNode } from '../../components/nodes/text-node';

export const nodeTypes: NodeTypes = { text: TextNode };
export const edgeTypes: EdgeTypes = {};
```

A `node.type` with no matching registry key renders the default node and logs a warning.

## 6. Viewport

The viewport is the pan/zoom transform `{ x, y, zoom }` over an effectively infinite canvas. `fitView` frames all nodes; `useReactFlow()` exposes `setViewport`, `fitView`, `zoomIn/Out`, and coordinate helpers (`screenToFlowPosition` — essential for drag-and-drop "add node where I dropped"). Read [layout-and-positioning.md](./layout-and-positioning.md) and the viewport doc for coordinate work.

## 7. The minimum model to preserve in any change

1. Nodes/edges are **controlled arrays you own**; React Flow mutates them only through change handlers you apply immutably.
2. **IDs are the contract** between nodes and edges; keep them unique/stable.
3. **`type` strings bind to the registry**; keep registry stable and complete.
4. **`data` is typed and serializable**; domain logic lives outside render.
5. Hooks require a **provider** context.

## Anti-patterns

- Treating React Flow as uncontrolled while also passing `nodes`/`edges` (mixing modes).
- Recreating `nodeTypes`/`edgeTypes`/`defaultEdgeOptions` objects inline each render.
- Storing derived data in `data` that you should compute (see computing-flows doc / [state-management-and-events.md](./state-management-and-events.md)).
- Non-string or unstable IDs.

## Agent instructions

- Before editing, identify which of the five model invariants the change touches and preserve the rest.
- When adding interactivity to a static flow, convert it to the controlled pattern first.
- Never recommend storing non-serializable values in `data` for a flow that is persisted.
