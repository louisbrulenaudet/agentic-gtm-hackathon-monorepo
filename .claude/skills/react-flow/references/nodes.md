# Nodes

**Covers:** node shapes, typed data contracts, node factories, registration, composition, and safe evolution of node schemas.

**Read when:** adding a node type, typing node data, building a node factory, or migrating a node's data shape.

## 1. Typed node data (discriminated union)

Type each node's `data` and bind it to its `type` string. Use a discriminated union so `type` narrows `data`.

```ts
// types/flow.ts
import type { Node } from '@xyflow/react';

export type TextNodeData = { label: string; value: string };
export type DecisionNodeData = { label: string; condition: string };

export type TextNode = Node<TextNodeData, 'text'>;
export type DecisionNode = Node<DecisionNodeData, 'decision'>;

// The app-wide union — use everywhere you handle "some node".
export type AppNode = TextNode | DecisionNode;
```

Parametrize the **state hooks and change-handler types** (the official pattern types the hooks/callbacks, not the `<ReactFlow>` element):

```tsx
import { useNodesState, useReactFlow, type OnNodesChange } from '@xyflow/react';

const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initial);
const onChange: OnNodesChange<AppNode> = onNodesChange;
const { getNodes, updateNodeData } = useReactFlow<AppNode, AppEdge>();
```

In a custom node component, type props with `NodeProps<TextNode>` so `data` is `TextNodeData`. See template `custom-node.tsx`.

## 2. Node factories (do not hand-build node literals)

Centralize creation so IDs, defaults, and `type` strings stay correct.

```ts
// lib/flow/node-factory.ts
import type { XYPosition } from '@xyflow/react';
import type { TextNode } from '../../types/flow';

let seq = 0;
const nextId = (p: string) => `${p}_${++seq}`; // or crypto.randomUUID()

export function createTextNode(position: XYPosition, value = ''): TextNode {
  return { id: nextId('text'), type: 'text', position, data: { label: 'Text', value } };
}
```

Benefits: one place enforces the `data` contract, IDs are unique, and `type` can't drift from the registry.

## 3. Registration

```ts
// lib/flow/registry.ts
import type { NodeTypes } from '@xyflow/react';
import { TextNode } from '../../components/nodes/text-node';
import { DecisionNode } from '../../components/nodes/decision-node';

export const nodeTypes: NodeTypes = {
  text: TextNode,
  decision: DecisionNode,
};
```

Module-scope, stable, complete. Adding a node type = add the data type + factory + component + this one entry. A missing entry → default node + console warning.

## 4. Composition

- Node components are **presentational**: render from `data`, render `<Handle />`s, raise changes via a callback or store, no fetching/business rules.
- Share UI via small subcomponents (`NodeShell`, `NodeHeader`, `NodeField`) so node types stay consistent and thin.
- Updating data from inside a node: call a passed-in handler or use `useReactFlow().updateNodeData(id, patch)` (v12) — never mutate `data`.

```tsx
// inside a custom node
const { updateNodeData } = useReactFlow();
<input value={data.value}
  onChange={e => updateNodeData(id, { value: e.target.value })} />
```

## 5. Node dimensions & dynamic handles

- React Flow **measures** rendered nodes; you usually don't set width/height. For SSR or deterministic layout, you can set `width`/`height` on the node, or `style`.
- If a node **adds/moves handles at runtime** (e.g. variable number of outputs), call `useUpdateNodeInternals()` → `updateNodeInternals(id)` after the change, or edges attach to stale handle positions. See [handles-and-connection-rules.md](./handles-and-connection-rules.md).

## 6. Safe schema evolution

- Add **optional** fields first; backfill on load (`fromJSON`) rather than assuming new fields exist on old data.
- Version the persisted graph (`{ version, nodes, edges }`) and migrate in `serialize.ts`. Never silently read a renamed field.
- Don't repurpose a `type` string — old persisted graphs reference it.

## Anti-patterns

- `data: any` or untyped node literals scattered across the app.
- Building nodes inline (`{ id: '1', ... }`) in many places instead of a factory.
- Domain logic / fetching inside node components.
- Mutating `data` (`data.value = x`) instead of `updateNodeData` / `setNodes(map)`.
- Forgetting `updateNodeInternals` after dynamic handle changes.

## Agent instructions

1. When asked to add a node type, produce **four** artifacts together: data type (in `types/flow.ts`, added to the union), factory (`node-factory.ts`), component (`components/nodes/`), registry entry.
2. Always wrap the component in `React.memo` (see [performance-and-scaling.md](./performance-and-scaling.md)) and type props with `NodeProps<TheNode>`.
3. If the node's `data` schema is ambiguous (which fields, editable?), **ask** before inventing a domain model.
4. If the flow is persisted, keep `data` serializable and version the schema.
