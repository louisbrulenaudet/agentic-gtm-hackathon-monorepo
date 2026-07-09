# Performance & Scaling

**Covers:** render minimization, memoization, stable references, data-shape discipline, large-graph strategies, and the anti-patterns that blow up performance.

**Read when:** a flow is laggy, dragging stutters, the graph is large (hundreds–thousands of nodes/edges), or you're proactively hardening a flow that will grow.

## 1. The core model

React Flow re-renders node and edge components frequently (drag, selection, viewport). Performance hinges on **stable references** so React can skip work, and on **not doing expensive work per node per frame**.

## 2. Mandatory baseline (apply to every non-trivial flow)

1. **Memoize custom components.** Custom node/edge components must be `React.memo`-wrapped **or declared outside** the parent component. (Official requirement.)
2. **Stable `nodeTypes` / `edgeTypes`.** Module scope or `useMemo`. Recreating them remounts every node/edge each render.
3. **Memoize prop functions and objects.** `useCallback` for `onConnect`/handlers; `useMemo` for `defaultEdgeOptions`, `snapGrid`, `fitViewOptions`, and any object/array prop passed to `<ReactFlow>`.
4. **No inline object/array literals** on `<ReactFlow>` or hot inner elements (`style={{...}}`, `data={{...}}`) — fresh identity each render defeats memoization.

## 3. State-access discipline

- **Select narrowly.** When using a store, subscribe to the slice you need (`useFlowStore(s => s.selectedId)`), not the whole `nodes` array — pulling the full array re-renders the component on every node tick.
- **Patch, don't rebuild.** To change one node, use `updateNodeData(id, patch)` (touches one node) instead of `setNodes` rebuilding the entire array with new identities.
- **Keep `data` small and serializable.** Large blobs / non-primitive churn in `data` cost diffing and break memo.

## 4. Large-graph strategies

- **Collapse with `hidden`.** Toggle `node.hidden`/`edge.hidden` to keep off-screen or collapsed subtrees out of the render rather than rendering everything.
- **`onlyRenderVisibleElements`** — a `<ReactFlow>` prop that skips rendering elements outside the viewport. Useful for very large graphs; test it for your case (it adds per-frame visibility work, so it helps large graphs and can hurt tiny ones).
- **Simplify node visuals at scale.** Avoid heavy shadows, gradients, blur, and complex DOM per node; these multiply across hundreds of nodes. Consider a simplified render at low zoom (`useViewport`).
- **Avoid animating many edges.** `animated: true` on thousands of edges is expensive.
- **Virtualize your own panels/lists** (sidebars of nodes) separately from the canvas.

## 5. Drag/interaction smoothness

- Don't run layout, network calls, or heavy derived computation inside drag handlers (`onNodeDrag`). Debounce or defer to `onNodeDragStop`.
- Compute derived values with `useNodesData`/selectors, not by syncing copies on every change.

## 6. Measuring before optimizing

- Use React DevTools Profiler to confirm which components re-render and why before changing code.
- The React Flow devtools/debugging guidance helps inspect store updates and re-renders.
- Establish the actual node/edge counts and target interaction (60fps drag? acceptable load time?) — **if scale/targets are unstated for a "make it fast" request, ask.**

## Anti-patterns (these blow up perf)

- Inline `nodeTypes`/`edgeTypes`/`defaultEdgeOptions` objects.
- Unmemoized node/edge components.
- Subscribing to the entire `nodes` array in many components.
- Rebuilding the whole nodes array to change one node.
- Heavy CSS (shadows/filters/gradients) per node at scale.
- Animating thousands of edges; running layout on every render.
- New object/array literals as `<ReactFlow>` props each render.

## Agent instructions

1. Before claiming a perf fix, verify the baseline (§2) is all in place — most "slow flow" reports are a missing memo or an inline registry.
2. For large graphs, propose `hidden` collapsing + `onlyRenderVisibleElements` + simplified node visuals, and confirm counts/targets with the user first if unknown.
3. Recommend profiling to locate the actual re-render cause; don't speculatively rewrite.
4. Prefer `updateNodeData` + narrow store selectors over whole-array updates.
