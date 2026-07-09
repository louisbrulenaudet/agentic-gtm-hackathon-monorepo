# Architecture & Project Layout

**Covers:** recommended folder structures, module boundaries, dependency rules, naming, and the small-app → scaling-app progression.

**Read when:** starting a project, organizing a growing flow, or refactoring a flow that has become a tangle of one giant component.

## 1. Core boundary principle

Keep **four concerns separate**:

1. **Rendering** — presentational node/edge components (`components/nodes`, `components/edges`). Dumb: read `data`, emit callbacks, no domain logic, no fetching.
2. **Registration** — the `nodeTypes` / `edgeTypes` maps wired from a registry (`lib/flow/registry.ts`). The only place type strings map to components.
3. **Domain logic** — graph transforms, validation, layout, serialization (`lib/flow/`). Pure functions, framework-agnostic, unit-testable.
4. **State / orchestration** — who owns `nodes`/`edges`, change handlers, derived state (`hooks/`, `stores/`).

Why: presentational nodes can be tested and themed independently; pure domain logic is unit-testable without rendering; a single registry prevents "type X not found" drift; isolating state ownership makes performance and persistence tractable.

## 2. Small-app layout

For a single flow with a handful of node types:

```
src/
├── App.tsx
├── index.css                     # global stylesheet (Tailwind + React Flow CSS, last)
├── components/
│   └── flow/
│       ├── flow-canvas.tsx        # <ReactFlow> shell, controlled state, Background/Controls/MiniMap
│       └── nodes/
│           ├── text-node.tsx
│           └── decision-node.tsx
├── lib/
│   └── flow/
│       ├── registry.ts            # nodeTypes / edgeTypes (module scope)
│       └── initial-graph.ts       # seed nodes/edges
└── types/
    └── flow.ts                    # AppNode / AppEdge unions, node data types
```

## 3. Scaling layout

Multiple flows, many node types, persistence, layout engine, undo/redo:

```
src/
├── components/
│   ├── flow/
│   │   ├── flow-canvas.tsx        # presentational shell only
│   │   ├── flow-toolbar.tsx       # Panel: add-node, layout, save (uses useReactFlow)
│   │   └── flow-minimap.tsx
│   ├── nodes/                     # one folder/file per node type, presentational
│   │   ├── text-node.tsx
│   │   └── http-node.tsx
│   └── edges/
│       └── labeled-edge.tsx
├── hooks/
│   ├── use-flow-graph.ts          # state ownership wrapper (nodes/edges + handlers)
│   ├── use-add-node.ts
│   └── use-flow-persistence.ts
├── lib/
│   └── flow/
│       ├── registry.ts            # node/edge type maps + per-type metadata
│       ├── node-factory.ts        # typed createX node factories
│       ├── layout.ts              # pure auto-layout (Dagre/ELK) — no React
│       ├── serialize.ts           # toJSON / fromJSON, versioned
│       ├── validate-connection.ts # isValidConnection + business rules
│       └── transforms.ts          # pure graph operations (add/remove/connect)
├── stores/
│   └── flow-store.ts              # Zustand store IF state outgrows components
├── features/
│   └── pipeline-editor/           # feature-scoped flow + its node types
│       ├── components/
│       ├── nodes/
│       └── lib/
└── types/
    ├── flow.ts                    # AppNode / AppEdge / data unions
    └── flow-json.ts               # persisted (wire) shapes
```

## 4. Dependency rules

```
components/nodes ─┐
components/edges ─┼─► types/   (and read data only)
components/flow  ─┘
hooks/  ─► lib/flow, stores, types
lib/flow ─► types        (NO imports of components or hooks; stays pure)
stores/ ─► lib/flow, types
```

- `lib/flow/*` must **not** import React components or hooks. If it needs React, it belongs in `hooks/`.
- Node/edge components depend only on their `data` type and props — never reach into stores directly unless the project's state pattern explicitly uses that (document it).
- The registry is imported by the canvas, not by individual nodes.

## 5. Naming conventions

- **Files:** kebab-case (`text-node.tsx`, `validate-connection.ts`). (Matches this repo's oxc rule too.)
- **Node type strings:** snake_case or kebab, **consistent project-wide** (`'text'`, `'http_request'`). The string in `node.type` must exactly equal the registry key.
- **Components:** PascalCase (`TextNode`). **Factories:** `createTextNode`. **Hooks:** `useFlowGraph`.
- **Data types:** `TextNodeData`; node alias `TextNode` = `Node<TextNodeData, 'text'>` (see template `node-data-types.ts`).

## 6. Anti-patterns

- One 800-line `<Flow>` component holding state, node JSX, layout, and persistence.
- Defining node components and `nodeTypes` in the same file as `<ReactFlow>` and recreating the map each render.
- Domain logic (fetching, business rules) inside node render components.
- A `utils.ts` dumping ground instead of `lib/flow/` with named modules.
- Inventing folders without the boundary rationale above.

## Agent instructions

1. **Match the existing layout** if one exists; do not impose this structure on a codebase mid-stream without asking.
2. For greenfield, pick **small-app** layout unless the user signals scale (many node types, persistence, undo/redo) → then **scaling**.
3. When refactoring a monolith, extract in this order: (1) pull node components out + create `registry.ts`; (2) lift pure logic into `lib/flow/`; (3) wrap state in a `use-flow-graph` hook; (4) introduce a store only if needed.
4. Never create `stores/` unless state genuinely outgrows components or the user asks (see [state-management-and-events.md](./state-management-and-events.md)).
