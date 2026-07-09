# Custom Nodes & Custom Edges

**Covers:** component composition, data-driven rendering, memoization boundaries, theming hooks, and the interface between custom components and the rest of the app.

**Read when:** designing the structure of a custom node/edge (as opposed to just typing data — for typing see [nodes.md](./nodes.md) / [edges.md](./edges.md)).

## 1. Custom node component contract

A custom node receives `NodeProps<TNode>`: `{ id, data, selected, type, dragging, positionAbsoluteX, positionAbsoluteY, ... }`. It must:

- Render its visual shell from `data`.
- Render `<Handle />`(s) for any connection points.
- Be **memoized** (`React.memo`) or declared at module scope (React Flow re-renders nodes often).
- Emit changes via `useReactFlow().updateNodeData(id, patch)` or a store action — **never** mutate `data`.

```tsx
import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { TextNode } from '../../types/flow';

export const TextNode = memo(function TextNode({ id, data, selected }: NodeProps<TextNode>) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`rf-node ${selected ? 'rf-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <label className="rf-node__label">{data.label}</label>
      <input
        className="nodrag"                         // nodrag = typing won't drag the node
        value={data.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
```

Note the **`nodrag`** utility class on the input: without it, dragging inside the field pans/drags the node. Use `nowheel` on scrollable inner content, `nopan` to block panning.

## 2. Composition pattern

Extract shared chrome so node types stay thin and visually consistent:

```tsx
// components/nodes/node-shell.tsx
export function NodeShell({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return <div className={`rf-node ${selected ? 'rf-node--selected' : ''}`}>{children}</div>;
}
```

Each node type composes `NodeShell` + `NodeHeader` + field components. Domain logic stays in `lib/flow/` and hooks; the node only renders and emits.

## 3. Memoization boundaries

- Wrap the whole node/edge component in `React.memo` (or declare it at module scope and pass via the stable `nodeTypes` map).
- Keep `data` shapes small and stable; passing a fresh object identity each render defeats `memo`. Update via `updateNodeData` (patches one node) rather than rebuilding the whole array when only one node changes.
- Don't put inline `style={{...}}` objects on hot inner elements; use classes.

See [performance-and-scaling.md](./performance-and-scaling.md) for the full perf model.

## 4. Custom edges

Custom edges receive `EdgeProps<TEdge>` with `sourceX/Y`, `targetX/Y`, `sourcePosition`, `targetPosition`, `markerEnd`, `data`. Compute the path with a built-in helper and render `<BaseEdge />`; put interactive UI in `<EdgeLabelRenderer>` (a single HTML overlay layer):

```tsx
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import type { LabeledEdge } from '../../types/flow';

export function LabeledEdge(props: EdgeProps<LabeledEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

## 5. Theming hooks

- Style via the `--xy-*` CSS variables and your own classes (see [styling-theming-and-ux.md](./styling-theming-and-ux.md)); read `selected`/`dragging` from props to drive visual state.
- Don't hardcode colors per node — derive from CSS variables / design tokens so `colorMode` and dark mode work.

## Anti-patterns

- Unmemoized node components (re-render storms).
- Fetching/business logic inside the node component.
- Missing `nodrag`/`nowheel` on interactive inner elements.
- Building edge labels inside SVG instead of `EdgeLabelRenderer`.
- Recreating `data` object identity on every parent render.

## Agent instructions

1. Always `React.memo` custom node/edge components and type props with `NodeProps<T>` / `EdgeProps<T>`.
2. Add `nodrag` to inputs/buttons, `nowheel` to scrollable regions inside nodes.
3. Update node state via `updateNodeData`; never mutate `data`.
4. Keep components presentational; route domain logic to `lib/flow/` and hooks.
