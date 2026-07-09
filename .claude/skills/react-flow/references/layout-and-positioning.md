# Layout & Positioning

**Covers:** manual positioning vs automatic layout, choosing a layout engine, isolating layout logic from rendering, sub-flows/grouping, and the measured-dimensions gotcha.

**Read when:** the graph is generated (not hand-placed), you need auto-layout, tree/hierarchy layout, grouping, or "arrange" actions.

## 1. Manual vs automatic — decision rule

| Graph origin | Approach |
| --- | --- |
| Small, authored, user drags nodes around | **Manual** `position` (seed positions, persist on `onNodeDragStop`) |
| Generated from data, hierarchical/tree | **Dagre** (simplest; directed graphs, tree-ish) |
| Generated, complex constraints, ports, orthogonal routing | **ELK / elkjs** (most configurable, async, heavier) |
| Single-root tree, uniform nodes | **d3-hierarchy** |
| Force/physics, non-tree | **d3-force** (iterative, async) |

**Default for generated graphs: Dagre.** Only reach for ELK when Dagre's results are insufficient (ports, layered orthogonal routing). **If the engine is unspecified and the graph is generated, ask the user** — it's a real trade-off (Dagre simple/synchronous vs ELK powerful/async/complex).

## 2. Isolate layout from rendering

Layout is a **pure function** in `lib/flow/layout.ts` — it takes nodes+edges, returns repositioned nodes. No React, no hooks, no rendering. This keeps it unit-testable and swappable.

```ts
// lib/flow/layout.ts — Dagre (synchronous)
import Dagre from '@dagrejs/dagre';
import type { AppNode, AppEdge } from '../../types/flow';

export function layoutWithDagre(
  nodes: AppNode[],
  edges: AppEdge[],
  direction: 'TB' | 'LR' = 'TB',
): AppNode[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction });

  edges.forEach((e) => g.setEdge(e.source, e.target));
  nodes.forEach((n) =>
    g.setNode(n.id, {
      width: n.measured?.width ?? n.width ?? 172,
      height: n.measured?.height ?? n.height ?? 36,
    }),
  );

  Dagre.layout(g);

  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    // Dagre centers nodes; React Flow positions from top-left.
    const w = n.measured?.width ?? n.width ?? 172;
    const h = n.measured?.height ?? n.height ?? 36;
    return { ...n, position: { x: x - w / 2, y: y - h / 2 } };
  });
}
```

## 3. Apply layout in the component

```tsx
const { fitView } = useReactFlow();

const onLayout = useCallback((dir: 'TB' | 'LR') => {
  setNodes((ns) => layoutWithDagre(ns, edges, dir));
  // fit after the next paint so new positions/dimensions are measured
  window.requestAnimationFrame(() => fitView());
}, [edges, setNodes, fitView]);
```

## 4. The measured-dimensions gotcha

React Flow **measures** node DOM after first render; before that, `measured.width/height` are undefined. Layout that depends on real sizes must run **after** nodes are measured:

```tsx
const nodesInitialized = useNodesInitialized();
useEffect(() => {
  if (nodesInitialized) {
    setNodes((ns) => layoutWithDagre(ns, edges));
    fitView();
  }
}, [nodesInitialized]); // run once on first measurement
```

Skipping this gives layouts computed from fallback sizes → overlapping or misaligned nodes.

## 5. Async engines (ELK / d3-force)

ELK and d3-force are asynchronous/iterative. Wrap in a hook that reads via `useReactFlow().getNodes()/getEdges()`, computes, then `setNodes()` + `fitView()`, gated on `useNodesInitialized`. Keep the engine call in `lib/flow/` and the React glue in `hooks/`.

## 6. Sub-flows / grouping

- A child node belongs to a parent via `parentId`; set `extent: 'parent'` to constrain dragging inside the parent.
- Child `position` is **relative to the parent**.
- Order matters: parent nodes must appear before their children in the `nodes` array.
- Group nodes (`type: 'group'`) are containers; layout children within the group's coordinate space.

## Anti-patterns

- Layout logic inside a node/canvas component, entangled with rendering.
- Running layout before nodes are measured (`useNodesInitialized` skipped).
- Forgetting the Dagre center→top-left offset (nodes drift).
- Re-running expensive layout on every render instead of on explicit "arrange" / data-change.
- Picking ELK's complexity when Dagre suffices.

## Agent instructions

1. Put the engine call in `lib/flow/layout.ts` as a pure function; wire it from a hook/handler.
2. Default to Dagre for generated graphs; **ask** before choosing ELK vs Dagre when unspecified.
3. Always gate dimension-dependent layout on `useNodesInitialized` and `fitView` after applying.
4. For sub-flows, set `parentId` + `extent: 'parent'` and order parents before children.
