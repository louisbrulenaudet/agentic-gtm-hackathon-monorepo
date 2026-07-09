# Setup & Installation

**Covers:** installing `@xyflow/react`, the mandatory stylesheet import, parent-container sizing, the Tailwind v4 ordering caveat, starter-template strategy, and a first-run verification checklist.

**Read when:** bootstrapping a new flow, adding React Flow to an existing app, or diagnosing "nothing renders / unstyled / blank canvas" (also see [debugging-and-common-failures.md](./debugging-and-common-failures.md)).

## 1. Install

The package is **`@xyflow/react`** (React Flow v12). React 18+.

```bash
pnpm add @xyflow/react        # or npm i / yarn add / bun add
```

> The legacy package was `reactflow` (v11) / `react-flow-renderer` (≤v10). If a codebase imports from `reactflow`, it is pre-v12 — read [debugging-and-common-failures.md](./debugging-and-common-failures.md) §migration before mixing APIs.

**Recommended project tooling:** Vite + React + TypeScript for fast setup and HMR. React Flow ships an official Vite starter template — prefer it for greenfield work:

```bash
npm create vite@latest my-flow -- --template react-ts
cd my-flow && pnpm add @xyflow/react
# Official React Flow Vite starter (alternative): see reactflow.dev "Getting started".
```

## 2. The three non-negotiables

These cause the vast majority of "it doesn't work" reports.

### 2.1 Import the stylesheet (required)

```ts
import '@xyflow/react/dist/style.css';
```

Without it, nodes are unstyled and mispositioned, handles are invisible, and panning/zoom/edges look broken. Import it **once**, app-wide (root entry or the global stylesheet). For minimal base styles only, `@xyflow/react/dist/base.css` exists, but default to the full `style.css`.

### 2.2 The parent container needs explicit dimensions (required)

`<ReactFlow />` fills its parent via `width/height: 100%`. If the parent has no resolved height, the flow collapses to **0px** and you see nothing.

```tsx
// ✅ Explicit size
<div style={{ width: '100%', height: '100vh' }}>
  <ReactFlow nodes={nodes} edges={edges} />
</div>
```

Valid sizing strategies: fixed px, `100vh`/`100vw`, `flex: 1` inside a sized flex column, or a grid track with a definite size. **Never** rely on an `auto`-height parent.

### 2.3 Unique, stable, string IDs (required)

Every node and edge needs a unique `id: string`. Duplicate, numeric, or render-unstable IDs break selection, edges, and reconciliation.

## 3. Tailwind CSS v4 ordering caveat

Tailwind v4's preflight/reset can override React Flow's structural styles if loaded **after** them. Import React Flow's CSS **in your global stylesheet, after the Tailwind layers**, so React Flow wins the cascade for its own elements:

```css
/* src/index.css (global stylesheet) */
@import 'tailwindcss';

/* Import React Flow AFTER Tailwind so preflight doesn't clobber it. */
@import '@xyflow/react/dist/style.css';
```

If you instead import the React Flow CSS in a JS module that the bundler injects before Tailwind, you can get subtly broken handles/edges. When in doubt, keep both imports in the single global stylesheet with React Flow last. (Tailwind v3 projects are usually fine with a JS-side import, but the global-stylesheet-last rule is the safe default.)

**Do not reorder these imports "for cleanliness" without re-checking this caveat** — it is a documented footgun.

## 4. Minimal first flow

See `templates/flow-shell.tsx` for the production shell. Smallest working unit:

```tsx
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodes = [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Hello' } }];
const edges = [];

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

This is read-only. For interactivity (drag/select/connect), use the controlled pattern from `examples/minimal-controlled-flow.tsx`.

## 5. Provider

Use `<ReactFlowProvider>` when:
- hooks (`useReactFlow`, `useNodes`, `useStore`, …) are called **outside** the `<ReactFlow>` subtree (e.g. a toolbar sibling), or
- multiple components share flow state, or
- you render multiple flows on one page.

```tsx
<ReactFlowProvider>
  <Toolbar />        {/* can use useReactFlow() */}
  <FlowCanvas />
</ReactFlowProvider>
```

## 6. SSR / SSG note

React Flow measures DOM to lay out nodes; it needs the browser. Under Next.js App Router or other SSR/SSG, render the flow client-side (`'use client'` and/or dynamic import with `ssr: false`), and provide explicit node `width`/`height` if you need deterministic first paint. See the SSR/SSG doc before shipping server-rendered flows.

## 7. First-run verification checklist

- [ ] `@xyflow/react` installed (not `reactflow`).
- [ ] `@xyflow/react/dist/style.css` imported once, app-wide (Tailwind v4: after Tailwind in the global stylesheet).
- [ ] `<ReactFlow />` wrapper has explicit, non-zero width **and** height.
- [ ] Nodes/edges have unique string IDs.
- [ ] Provider present if hooks are used outside `<ReactFlow>`.
- [ ] Default `<Background />` + `<Controls />` render; `fitView` frames the graph.
- [ ] In-browser: nodes render, pan/zoom works, a node can be dragged.

## Anti-patterns

- Importing from `reactflow` in a v12 app.
- Forgetting the stylesheet, then "fixing" layout with manual CSS hacks.
- Auto-height parent + later debugging a "rendering bug" that is really a 0px canvas.
- Tailwind v4 with React Flow CSS imported before the Tailwind layers.
- Server-rendering a flow without a client boundary.

## Agent instructions

1. Detect package + version and the **current CSS import location** before changing setup. Do not move the import without applying §3.
2. When scaffolding, emit the sized wrapper + CSS import + controlled state together — never a snippet that silently lacks one.
3. If the user reports "blank/unstyled", check §2 (CSS, size, IDs) **before** touching component code; route to the debugging module.
4. Default to Vite + TS for new projects; mention the official starter template.
