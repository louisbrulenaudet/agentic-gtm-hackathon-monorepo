# Handles & Connection Rules

**Covers:** source/target handles, multiple/identified handles, connection validation, business-rule enforcement, and ergonomic patterns for complex graphs.

**Read when:** connections won't form, you need typed/constrained connections, multi-handle nodes, or "only connect compatible ports" rules. For broken connections also read [debugging-and-common-failures.md](./debugging-and-common-failures.md).

## 1. Handles are required for connections

A custom node only participates in connections if it renders `<Handle />`. A node with no handle can't be connected to.

```tsx
import { Handle, Position } from '@xyflow/react';

<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} />
```

- `type`: `'source'` (connection starts here) or `'target'` (ends here).
- `position`: `Position.Top|Right|Bottom|Left`.
- `id`: **required when a node has more than one handle of the same type** — edges use `sourceHandle`/`targetHandle` to pick.

## 2. Multiple handles

```tsx
<Handle type="source" id="yes" position={Position.Bottom} style={{ left: '25%' }} />
<Handle type="source" id="no"  position={Position.Bottom} style={{ left: '75%' }} />
```

Edges then carry `sourceHandle: 'yes'`. **Mismatched or missing handle ids are the #1 cause of "edge connects to wrong spot / won't connect."** Verify the id on the handle equals the `sourceHandle`/`targetHandle` on the edge.

## 3. Dynamic handles → `useUpdateNodeInternals`

If handles are added/removed/moved at runtime, React Flow's cached handle bounds go stale and edges render to the wrong place. After the change:

```tsx
const updateNodeInternals = useUpdateNodeInternals();
useEffect(() => { updateNodeInternals(id); }, [handleCount, id, updateNodeInternals]);
```

## 4. Connection validation

Two layers:

**a) `isValidConnection` on `<ReactFlow>` (or per-Handle)** — runs during the connect drag; returning `false` shows the no-drop cursor and blocks the connection. Use for structural/business rules.

```tsx
import type { Connection, IsValidConnection } from '@xyflow/react';

const isValidConnection: IsValidConnection = (c: Connection) => {
  if (c.source === c.target) return false;        // no self-loops
  // example port-compatibility rule:
  return c.sourceHandle?.split(':')[0] === c.targetHandle?.split(':')[0];
};

<ReactFlow isValidConnection={isValidConnection} ... />
```

**b) Filtering in `onConnect`** — last line of defense before the edge is added (e.g. dedupe, cardinality):

```tsx
const onConnect = useCallback((c: Connection) => {
  setEdges(eds => {
    const exists = eds.some(e => e.source === c.source && e.target === c.target);
    return exists ? eds : addEdge({ ...c, type: 'labeled' }, eds);
  });
}, [setEdges]);
```

Also relevant: `connectionMode` (`'strict'` default = source↔target only; `'loose'` = any handle to any), and `<Handle isConnectable={...}>` / `isConnectableStart`/`isConnectableEnd`.

## 5. Cardinality (limit connections per handle)

Use `useNodeConnections` (v12) inside a node to count and cap:

```tsx
const connections = useNodeConnections({ handleType: 'target', handleId: 'in' });
const atCapacity = connections.length >= 1;
<Handle type="target" id="in" position={Position.Top} isConnectable={!atCapacity} />
```

Both `useNodeConnections({ handleType, handleId })` (node-level, the default to use) and `useHandleConnections` (handle-level) exist in v12; `useNodeConnections` returns the array of `NodeConnection`s for the given handle.

## 6. Ergonomics for complex graphs

- Encode port type in the handle `id` (`'number:out'`) and compare in `isValidConnection` — cheap, declarative.
- Make handles generous to click (size via `.react-flow__handle` / utility classes) for usability.
- Use `connectionLineType`/`connectionLineStyle` to preview the connection as the user drags.
- Use `onConnectStart`/`onConnectEnd` to implement "drop on empty canvas to create a node" UX (combine with `screenToFlowPosition`).

## Anti-patterns

- Custom node without a `<Handle />`, then "why can't I connect it?"
- Multiple same-type handles without `id`s.
- Dynamic handles without `updateNodeInternals`.
- Encoding all rules in `onConnect` only (no drag feedback) — users get no cursor hint.
- Using `connectionMode="loose"` without a real need (loosens all validation).

## Agent instructions

1. For "connections won't form / land wrong," check in order: handle exists? · handle `type` correct? · handle `id` matches edge `sourceHandle`/`targetHandle`? · `isValidConnection` not rejecting? · dynamic handles missing `updateNodeInternals`?
2. When the user states a connection rule, implement it in **`isValidConnection`** (for drag feedback) and optionally enforce again in `onConnect`.
3. If the rule schema (which ports connect to which) is ambiguous, **ask** before inventing compatibility logic.
4. Prefer `useNodeConnections({ handleType, handleId })` for cardinality/inspection at the node level.
