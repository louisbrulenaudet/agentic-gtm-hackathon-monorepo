# Testing & Validation

**Covers:** what to test and how — unit tests for pure graph logic, integration tests for state wiring, and interaction tests for critical UI behavior.

**Read when:** adding tests for a flow, or deciding what's worth testing.

## 1. Testing priority (where the value is)

1. **Pure domain logic** (`lib/flow/`): node factories, graph transforms, `isValidConnection`, layout, serialize/deserialize. **Highest ROI** — fast, deterministic, no DOM. Test these first and thoroughly.
2. **State wiring** (hooks/store): change handlers apply correctly, `onConnect` enforces rules, derived/computed values.
3. **Interaction-critical UI** (the few behaviors that would be catastrophic if broken): can connect compatible ports, can't connect incompatible ones, delete works, save→load round-trips.

Don't try to unit-test React Flow's own rendering internals — test **your** logic and the **contract** at the boundary.

## 2. Pure logic — Vitest/Jest

```ts
import { describe, it, expect } from 'vitest';
import { createTextNode } from '../lib/flow/node-factory';
import { isValidConnection } from '../lib/flow/validate-connection';

describe('node factory', () => {
  it('creates a typed text node with a unique id', () => {
    const a = createTextNode({ x: 0, y: 0 });
    const b = createTextNode({ x: 0, y: 0 });
    expect(a.type).toBe('text');
    expect(a.id).not.toBe(b.id);
    expect(a.data).toEqual({ label: 'Text', value: '' });
  });
});

describe('connection rules', () => {
  it('rejects self-loops', () => {
    expect(isValidConnection({ source: 'a', target: 'a', sourceHandle: null, targetHandle: null }))
      .toBe(false);
  });
});
```

Serialization round-trip is a must-test if you persist:

```ts
it('round-trips a graph', () => {
  const graph = { version: 1, nodes, edges };
  expect(fromJSON(toJSON(graph))).toEqual(graph);
});
```

## 3. Component / interaction — React Testing Library

React Flow needs DOM measurement; jsdom doesn't measure layout. Two practical paths:

- **Render inside `<ReactFlowProvider>`** and assert on your node/edge DOM (labels render, buttons present, callbacks fire). Mock `ResizeObserver`/`DOMMatrix` if the environment lacks them (the testing doc lists the globals React Flow expects).
- **Prefer Playwright/Cypress for true interaction** (drag to connect, pan/zoom, drag node). Real-browser E2E is the reliable way to test drag-and-connect; jsdom can't faithfully simulate pointer-based connections.

```tsx
// RTL: assert presentational contract, not pixel layout
render(
  <ReactFlowProvider>
    <ReactFlow nodes={[createTextNode({ x: 0, y: 0 })]} edges={[]} nodeTypes={nodeTypes} />
  </ReactFlowProvider>,
);
expect(screen.getByText('Text')).toBeInTheDocument();
```

## 4. What to assert at the boundary

- Factories produce correct `type`, unique IDs, valid default `data`.
- Transforms (add/remove/connect) return **new** arrays (immutability) with correct contents.
- `isValidConnection` accepts/rejects per the business rules (table-driven cases).
- `onConnect` dedupes / respects cardinality.
- Serialize → deserialize is lossless and version-aware.

## Anti-patterns

- Testing React Flow's internal rendering instead of your logic.
- Driving drag-to-connect in jsdom and asserting positions (unreliable).
- No round-trip test for a persisted graph.
- Snapshotting large rendered flows (brittle, low value).

## Agent instructions

1. Put the bulk of tests on **pure `lib/flow/` logic**; make those table-driven.
2. Use RTL only to assert the node/edge **presentational contract**; mock the DOM globals React Flow expects.
3. Recommend Playwright/Cypress for real connect/drag flows; don't fake them in jsdom.
4. Always test serialize↔deserialize when the graph is persisted.
