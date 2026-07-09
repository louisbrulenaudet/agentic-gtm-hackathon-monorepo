# Edges

**Covers:** edge contracts, edge types, custom edges, labels, interaction behaviors, markers, and edge update patterns.

**Read when:** styling/typing edges, adding custom edges, edge labels or edge buttons, or controlling edge creation/animation.

## 1. Edge contract

Minimum: `{ id, source, target }`. `source`/`target` are node IDs; `sourceHandle`/`targetHandle` pick a specific handle when nodes have multiple. Built-in edge types: `'default'` (bezier), `'straight'`, `'step'`, `'smoothstep'`. Set `type` to a registry key for custom edges.

## 2. Typed edge data

```ts
// types/flow.ts
import type { Edge } from '@xyflow/react';

export type LabeledEdgeData = { label: string };
export type LabeledEdge = Edge<LabeledEdgeData, 'labeled'>;
export type AppEdge = LabeledEdge | Edge; // include the default edge
```

## 3. Default edge options (don't repeat per edge)

Pass `defaultEdgeOptions` (module-scope constant) instead of setting markers/animated on every edge:

```ts
import { MarkerType, type DefaultEdgeOptions } from '@xyflow/react';

export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
  animated: false,
};
```

```tsx
<ReactFlow defaultEdgeOptions={defaultEdgeOptions} ... />
```

`addEdge` in `onConnect` merges these onto new edges. Apply markers/type here, not in `onConnect`, so creation stays consistent.

## 4. Custom edge — use `BaseEdge` + a path helper

Compute the path with a built-in helper (`getBezierPath`, `getSmoothStepPath`, `getStraightPath`), render `<BaseEdge />`, and put interactive content in `<EdgeLabelRenderer>`.

```tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { LabeledEdge } from '../../types/flow';

export function LabeledEdgeComponent({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, markerEnd, data,
}: EdgeProps<LabeledEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

Key points:
- `<EdgeLabelRenderer>` renders labels in a single HTML layer (not inside SVG) so they're crisp and interactive. Add `nodrag nopan` + `pointerEvents: 'all'` for clickable labels (e.g. a delete button).
- The `[path, labelX, labelY]` tuple from the path helper gives you the label anchor.
- Register in `edgeTypes` (`{ labeled: LabeledEdgeComponent }`), module scope.

See template `custom-edge.tsx` and `EdgeText` / `EdgeToolbar` API pages for label helpers.

## 5. Editing & removing edges

- Reconnect (drag an edge end to a new handle): handle `onReconnect` with the `reconnectEdge` utility.
- Delete on select+Backspace works out of the box (controlled state). For a delete button, render it in the edge label and call `setEdges(es => es.filter(e => e.id !== id))` or `useReactFlow().deleteElements`.
- Update edge data immutably via `setEdges(es => es.map(...))`; never mutate.

## 6. Markers & animation

- Markers: `markerStart`/`markerEnd` with `MarkerType.Arrow` / `MarkerType.ArrowClosed`, or a custom marker id.
- `animated: true` adds a dashed flow animation — cheap visually but avoid animating thousands of edges (see [performance-and-scaling.md](./performance-and-scaling.md)).

## Anti-patterns

- Inline `edgeTypes` object recreated each render.
- Putting markers/type on every edge instead of `defaultEdgeOptions`.
- Building label DOM inside the SVG path instead of `<EdgeLabelRenderer>`.
- Forgetting `nodrag nopan` on interactive labels (drags pan the canvas instead).
- Mutating edge arrays/data in place.

## Agent instructions

1. For a new custom edge, emit: data type (+ union), edge component (BaseEdge + path helper), registry entry, and — if labels are interactive — the `EdgeLabelRenderer` block with `nodrag nopan`.
2. Default new flows to `defaultEdgeOptions` with `smoothstep` + `ArrowClosed` unless the user specifies otherwise.
3. Verify the path-helper name and `EdgeProps` field names against the API reference before emitting.
