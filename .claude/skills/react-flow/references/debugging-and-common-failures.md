# Debugging & Common Failures

**Covers:** a symptom → probable cause → fix table for the most common React Flow failures, plus a triage protocol.

**Read when:** anything is broken — blank canvas, unstyled nodes, connections failing, stale state, wrong positions, console warnings. Pair with [setup-and-installation.md](./setup-and-installation.md) and [handles-and-connection-rules.md](./handles-and-connection-rules.md).

## 1. Triage protocol — classify the bug first

Before editing, classify into one of four buckets; it dictates where to look:

1. **Styling** — looks wrong / invisible / mispositioned but state seems fine → CSS import & sizing.
2. **Rendering** — nothing shows / wrong component / no remount on change → container size, registry, IDs, keys.
3. **Interaction** — can't drag/select/connect → change handlers, handles, validation.
4. **Data/state** — values stale / out of sync / lost on save → state ownership, mutation, serialization.

State which bucket you're in, then use the table.

## 2. Symptom → cause → fix

| Symptom | Probable cause | Fix |
| --- | --- | --- |
| **Blank / empty canvas** | Parent container has no height (collapses to 0px) | Give the `<ReactFlow>` wrapper explicit `width`/`height` (`100vh`, fixed px, or `flex:1` in a sized column) |
| **Nodes render unstyled / handles invisible / edges look wrong** | Stylesheet not imported | `import '@xyflow/react/dist/style.css'` once app-wide |
| **Styles broken only with Tailwind v4** | Tailwind preflight loaded after React Flow CSS | Import React Flow CSS in the global stylesheet **after** Tailwind layers |
| **"Node type not found, using default"** warning | `node.type` has no `nodeTypes` entry, or registry recreated inline | Add the registry key; define `nodeTypes` at module scope |
| **Whole flow remounts / flickers each render** | `nodeTypes`/`edgeTypes` object recreated every render | Move to module scope or `useMemo` |
| **Can't drag / select / delete nodes** | Missing `onNodesChange` (or state mutated in place) | Wire `onNodesChange` (use `useNodesState`) and apply changes immutably |
| **Edges don't appear after connecting** | `onConnect` missing or not using `addEdge` | `onConnect={(c) => setEdges(es => addEdge(c, es))}` |
| **Can't create a connection at all** | Custom node has no `<Handle />`, or wrong handle `type` | Render `<Handle type="source/target" />`; check source vs target |
| **Edge connects to wrong spot / wrong handle** | Multiple handles without `id`, or `sourceHandle`/`targetHandle` mismatch | Give each handle a unique `id`; match edge `sourceHandle`/`targetHandle` |
| **Connection blocked unexpectedly** | `isValidConnection` returning false / `connectionMode` strict | Inspect the validator; relax rule or fix handle types |
| **Edges attach to stale handle positions after UI change** | Dynamic handles without internals update | Call `useUpdateNodeInternals()`→`updateNodeInternals(id)` after handle changes |
| **"zustand provider as an ancestor" error** | Hook used outside provider | Wrap subtree in `<ReactFlowProvider>` (or move hook inside `<ReactFlow>`) |
| **Node value resets / stale on edit** | Mutating `data` in place, or stale closure | Use `updateNodeData(id, patch)` / functional `setNodes(ns => ...)` |
| **Graph lost / corrupt after save & reload** | Non-serializable `data` (functions/instances) or unstable IDs | Keep `data` JSON-serializable; persist via `toObject`; stable string IDs |
| **Duplicate-key / reconciliation warnings** | Duplicate or render-unstable node/edge IDs | Generate stable unique string IDs (uuid/nanoid/owned counter) |
| **Layout overlaps / misaligned** | Layout ran before nodes measured, or Dagre center offset ignored | Gate on `useNodesInitialized`; subtract w/2,h/2 for Dagre |
| **Laggy with many nodes** | Unmemoized nodes, inline registries, whole-array subscriptions | Apply the perf baseline ([performance-and-scaling.md](./performance-and-scaling.md)) |
| **Typing in a node drags it / scroll zooms canvas** | Missing utility classes | Add `nodrag` to inputs, `nowheel` to scrollable content, `nopan` to overlays |
| **Imports fail / mixed APIs** | Importing from legacy `reactflow` in a v12 app | Use `@xyflow/react` consistently (see §3) |
| **Blank under Next.js / SSR** | Server render without browser measurement | Render client-side (`'use client'` / dynamic import `ssr:false`) |

## 3. Legacy package note (only when you actually find it)

If the codebase imports from **`reactflow`** (v11) or **`react-flow-renderer`** (≤v10), it predates v12. This skill targets the current `@xyflow/react`. Don't mix APIs across versions. If a migration is in scope, treat it as a deliberate, separate task and confirm with the user before rewriting imports wholesale. Otherwise, author all new code against `@xyflow/react`.

## 4. When to stop and verify against docs

For any low-confidence fix — an unfamiliar prop, an edge-case event, version-specific behavior — confirm the API/behavior against the official `@xyflow/react` v12 reference before proposing it. Don't guess prop names.

## Agent instructions

1. **Always classify** the bug (styling/rendering/interaction/data) before editing.
2. For "not rendering": check **CSS import → parent size → IDs → registry** in that order before touching component logic.
3. For "can't connect": check **handle exists → type → id match → isValidConnection → updateNodeInternals**.
4. Reproduce/confirm in-browser when possible; report the actual cause, not a guess.
