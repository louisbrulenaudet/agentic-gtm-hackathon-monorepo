---
name: react-flow
description: >-
  Build, extend, refactor, debug, and productionize React Flow (@xyflow/react)
  node-based UIs in React + TypeScript. Load when implementing flows, custom
  nodes/edges, handles & connection rules, controlled state & events, auto-layout,
  theming, performance tuning for large graphs, or diagnosing rendering/styling/
  connection bugs. Entry point and router for all React Flow sub-skills.
type: core
library: '@xyflow/react'
library_version: '12.x (React Flow v12)'
disable-model-invocation: true
---

# React Flow Expert

React Flow (npm package **`@xyflow/react`**, the v12 line) is a library for building node-based UIs in React: editors, diagrams, pipelines, mind maps, whiteboards, and dataflow graphs. A flow is a set of **nodes** and **edges** rendered inside a **`<ReactFlow />`** container, driven by a **controlled** state pattern (`nodes`, `edges`, `onNodesChange`, `onEdgesChange`, `onConnect`).

This skill is the **operator manual for an AI coding agent**. It is deliberately concise. Specialist depth lives in `references/`; copy-ready code lives in `examples/` and `templates/`. Use progressive disclosure: read only the module the current task needs.

> **CRITICAL — package identity.** The package is `@xyflow/react` (v12), **not** the legacy `react-flow-renderer` / `reactflow` (v11 and earlier). Imports come from `@xyflow/react`. If you see `import ... from 'reactflow'`, you are in a pre-v12 codebase — see [references/debugging-and-common-failures.md](./references/debugging-and-common-failures.md) before changing anything.

> **CRITICAL — documentation is ground truth.** Verify package name, imports, hooks, props, and type names against the official `@xyflow/react` v12 docs before emitting final code. Do not invent props, hooks, components, utilities, or type names. When a learned pattern conflicts with the API reference, **the API reference wins.**

> **CRITICAL — three non-negotiable setup facts** (cause ~80% of "nothing renders" reports): (1) you **must** import the stylesheet `@xyflow/react/dist/style.css`; (2) the **parent container of `<ReactFlow />` must have an explicit width and height**; (3) every node and edge needs a **unique string `id`**. See [references/setup-and-installation.md](./references/setup-and-installation.md).

## Use this skill when

- Bootstrapping a new node-based UI / diagram / editor / pipeline view.
- Adding or refactoring **custom nodes** or **custom edges**.
- Designing **handles** and **connection validation / business rules**.
- Wiring **controlled state**, change handlers, selection, viewport, or events.
- Integrating an **auto-layout** engine (Dagre, ELK, d3-hierarchy) or sub-flows/grouping.
- **Theming**, dark mode, accessibility, and interaction polish.
- **Performance** work for large graphs (hundreds–thousands of nodes/edges).
- **Debugging** missing renders, zero-size canvas, stale state, wrong IDs, broken connections, or CSS/stylesheet issues.
- Adding **tests** for node factories, graph transforms, and interaction-critical behavior.

## Do not use this skill when

- The task is generic React/state work with no node-graph surface.
- The user is on a different graph library (`d3`, `cytoscape`, `vis-network`, `react-digraph`) — say so; do not retrofit React Flow.
- It is pure backend/data work with no React Flow rendering or typing involved.

## Quick routing map

Match the user's intent to the **one or two** modules to read first. Do not read everything.

| User intent / symptom | Read first | Then |
| --- | --- | --- |
| "Set up / bootstrap a flow", new project, install | [setup-and-installation.md](./references/setup-and-installation.md) | [core-concepts.md](./references/core-concepts.md), template `flow-shell.tsx` |
| "Where should files go", refactor architecture, scaling | [architecture-and-project-layout.md](./references/architecture-and-project-layout.md) | — |
| Understand the mental model (nodes/edges/IDs/controlled state) | [core-concepts.md](./references/core-concepts.md) | — |
| Add / type / evolve a **node** | [nodes.md](./references/nodes.md) | [custom-nodes-and-custom-edges.md](./references/custom-nodes-and-custom-edges.md) |
| Add / type / style an **edge**, edge labels, edge buttons | [edges.md](./references/edges.md) | [custom-nodes-and-custom-edges.md](./references/custom-nodes-and-custom-edges.md) |
| "Connections won't form / wrong handle / invalid drops" | [handles-and-connection-rules.md](./references/handles-and-connection-rules.md) | [debugging-and-common-failures.md](./references/debugging-and-common-failures.md) |
| State updates, callbacks, selection, viewport, derived data | [state-management-and-events.md](./references/state-management-and-events.md) | [performance-and-scaling.md](./references/performance-and-scaling.md) |
| Auto-layout, grouping, sub-flows, positioning | [layout-and-positioning.md](./references/layout-and-positioning.md) | example `layout-integration-example.ts` |
| Custom node/edge component design, memoization, theming hooks | [custom-nodes-and-custom-edges.md](./references/custom-nodes-and-custom-edges.md) | [styling-theming-and-ux.md](./references/styling-theming-and-ux.md) |
| Styling, theming, dark mode, a11y, hover/focus/selection UX | [styling-theming-and-ux.md](./references/styling-theming-and-ux.md) | — |
| "It's laggy with many nodes", render storms, perf | [performance-and-scaling.md](./references/performance-and-scaling.md) | [state-management-and-events.md](./references/state-management-and-events.md) |
| Anything broken / not rendering / blank canvas | [debugging-and-common-failures.md](./references/debugging-and-common-failures.md) | example `troubleshooting-example.md` |
| Add tests | [testing-and-validation.md](./references/testing-and-validation.md) | — |
| "Is it ready to ship?" | [production-checklist.md](./references/production-checklist.md) | — |

## Default execution workflow

1. **Classify** the task: setup · architecture · nodes · edges · handles/connections · layout · state/events · styling · performance · debugging · testing.
2. **Route**: open the matching module(s) above. For debugging, always also open `debugging-and-common-failures.md`.
3. **Ground**: confirm every component, hook, prop, and type you will use against the official `@xyflow/react` v12 API reference before emitting code. Do not invent surface; the API reference wins over memory.
4. **Inspect the codebase**: detect version (`@xyflow/react` vs `reactflow`), where the CSS is imported, container sizing, the node/edge `*Types` registries, and the state-ownership pattern. Match existing conventions.
5. **Decide or ask**: if a blocking choice is ambiguous (see "Stop and ask"), ask rather than guess.
6. **Implement** from templates/examples; keep domain logic out of render components.
7. **Validate** (see below) before reporting done.

## React Flow gotchas (memorize)

- **No CSS = no usable flow.** Without `@xyflow/react/dist/style.css`, nodes render unstyled/misplaced and interactions break. Import it once, app-wide.
- **Zero-height parent = blank canvas.** `<ReactFlow />` fills its parent; a parent with no explicit/derived height collapses to 0px. Give the wrapper `width`/`height` (or `flex: 1` inside a sized flex column, or `100vh`).
- **Tailwind CSS v4 order caveat.** With Tailwind v4, import React Flow's CSS in your **global stylesheet after** the Tailwind layers so Tailwind's reset/preflight does not override React Flow's structural styles. See [setup-and-installation.md](./references/setup-and-installation.md).
- **Controlled state is the default contract.** Pass `nodes` + `edges` and handle `onNodesChange` / `onEdgesChange` / `onConnect`, applying changes with `applyNodeChanges` / `applyEdgeChanges` / `addEdge` (or via `useNodesState` / `useEdgesState`). Mutating state directly or dropping a change handler causes drag/select/delete to silently break.
- **`nodeTypes` / `edgeTypes` must be stable.** Define them at module scope (or `useMemo`). Recreating the object every render forces full remounts and warns in console.
- **Hooks need a provider.** `useReactFlow`, `useNodes`, `useStore`, etc. only work inside `<ReactFlow>` or a wrapping `<ReactFlowProvider>`. Calling them outside throws "Seems like you have not used zustand provider as an ancestor."
- **New handles need `useUpdateNodeInternals`.** If you add/move handles dynamically, edges attach to stale positions until you call `updateNodeInternals(nodeId)`.
- **IDs are strings and must be unique & stable.** Numeric or duplicate IDs, or IDs that change across renders, break selection, edges, and reconciliation.
- **Custom node data must round-trip.** Keep node `data` JSON-serializable if you persist/restore graphs; do not stash functions, class instances, or DOM nodes in `data`.

## Implementation defaults (apply unless told otherwise)

- **TypeScript-first**, strict. Type node/edge data via discriminated unions; derive `Node`/`Edge` aliases (see template `node-data-types.ts`).
- **Controlled flow** with `useNodesState` / `useEdgesState` for app-managed state; reach for a Zustand store only when state outgrows the component (cross-component access, undo/redo, server sync) — see [state-management-and-events.md](./references/state-management-and-events.md). **Do not introduce a state library unless the task needs it or the user asks.**
- **Registries at module scope**: one `nodeTypes` / `edgeTypes` map, populated from a registry module (template `node-registry-pattern.ts`).
- **Custom nodes** are presentational and `React.memo`-wrapped; domain logic lives in `lib/flow/` and hooks, not in the component.
- **`<Background />`, `<Controls />`, `<MiniMap />`** added by default for editor-style flows; drop `<MiniMap />` for tiny/embedded flows.
- **Manual positions** for small/authored graphs; an **auto-layout function** (pure, outside render) for generated graphs.
- Wrap the app in **`<ReactFlowProvider>`** whenever hooks are used outside the `<ReactFlow>` subtree or multiple components share flow state.

## Read-on-demand modules

Each file in `references/` is a focused sub-skill: it states what it covers, when to read it, recommendations, anti-patterns, a concrete pattern, and explicit agent instructions. Open them lazily per the routing map — never preload all of them.

## Ground-truth verification (run before final code)

- **Imports/APIs**: confirm every component, hook, prop, and type against the API reference. No undocumented surface.
- **CSS**: confirm `@xyflow/react/dist/style.css` is imported (and, under Tailwind v4, after the Tailwind layers) before changing setup.
- **Sizing**: confirm the `<ReactFlow />` parent has real dimensions before diagnosing a "not rendering" bug.
- **State/callbacks**: confirm who owns `nodes`/`edges` and which change handlers are wired before refactoring.
- **Low-confidence fixes**: consult the troubleshooting page before proposing a speculative fix.
- **Classify the bug** as data · rendering · styling · or interaction before editing (see debugging module).

## Stop and ask the user when…

- The **node `data` schema is ambiguous** (what fields, which are required, what's editable). Don't invent a domain model.
- The **persistence model is unknown** (how/where graphs are saved, server shape, versioning).
- The **layout engine is unspecified** and the graph is generated (Dagre vs ELK vs manual is a real trade-off).
- The **styling system is unclear or conflicting** (Tailwind v4 vs CSS Modules vs CSS-in-JS) — wrong guess breaks the gotcha above.
- **Performance targets are missing** but the graph is large ("how many nodes/edges, target interaction?").
- The **existing state-ownership pattern** (local vs Zustand vs Redux vs server) is unclear and the change spans it.

Ask a tight, specific question; do not stall on choices with an obvious default.

## Validation before final answer

1. `nodeTypes` / `edgeTypes` are **module-scope stable**; every key used by a node/edge exists in the map.
2. The flow is **controlled**: `onNodesChange` / `onEdgesChange` / `onConnect` are wired (or `useNodesState`/`useEdgesState` used) and changes are applied immutably.
3. **CSS imported**; `<ReactFlow />` parent has explicit dimensions.
4. All node/edge **IDs are unique, string, and stable**.
5. Hooks run **inside a provider**; dynamic handles trigger `useUpdateNodeInternals`.
6. Node `data` is **typed** and (if persisted) **serializable**; no functions/instances in `data`.
7. Type-check and lint pass; for diagrams, confirm in-browser that nodes render, drag, connect, and (if applicable) persist.

## Anti-patterns (do not do)

- Importing from `reactflow` in a v12 codebase, or mixing v11 and v12 APIs.
- Inventing props/hooks/types from memory instead of checking the API reference.
- Defining `nodeTypes`/`edgeTypes` inline in JSX (forces remounts).
- Mutating `nodes`/`edges` arrays or node `data` in place.
- Collapsing domain logic into node/edge render components.
- Stuffing functions, class instances, or huge blobs into node `data`.
- Changing the stylesheet import order "to clean it up" without checking the Tailwind caveat.
- Assuming a state-management library the project does not use.
- Calling React Flow hooks outside `<ReactFlowProvider>` / `<ReactFlow>`.
