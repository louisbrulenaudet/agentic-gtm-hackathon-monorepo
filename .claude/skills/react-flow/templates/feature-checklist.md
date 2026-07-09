# Feature Checklist Template

Copy this per new flow feature/subfeature. Drives consistent, complete delivery.

## Feature: `<name>`

### 0. Scope & questions (resolve before coding)
- [ ] Node `data` schema defined (fields, required, editable)? — if not, **ask**.
- [ ] Persistence model known (where/how saved, versioned)? — if not, **ask**.
- [ ] Layout: manual or auto? If auto + generated, engine chosen (Dagre default)? — if ambiguous, **ask**.
- [ ] Styling system confirmed (Tailwind v4 / CSS Modules / tokens)? — affects CSS order.
- [ ] Scale/perf target known if graph is large? — if not, **ask**.
- [ ] Existing state-ownership pattern identified (local / store / server)?

### 1. Types
- [ ] Node data type(s) added to `types/flow.ts` and to the `AppNode` union.
- [ ] Edge data type(s) added if needed.

### 2. Logic (`lib/flow/`)
- [ ] Node factory(ies) with unique IDs + valid default `data`.
- [ ] Connection rules in `validate-connection.ts` (`isValidConnection`).
- [ ] Any transforms/layout as pure functions.
- [ ] Serialize/deserialize updated if `data` shape changed (versioned).

### 3. Components
- [ ] Custom node/edge components: presentational, `React.memo`, typed props.
- [ ] `nodrag` / `nowheel` / `nopan` on interactive content.
- [ ] Registered in `lib/flow/registry.ts` (type string == registry key).

### 4. Wiring
- [ ] Controlled state handlers wired; updates immutable.
- [ ] Dynamic handles call `updateNodeInternals`.
- [ ] Hooks used inside `<ReactFlowProvider>`.

### 5. Validation
- [ ] Type-check + lint pass.
- [ ] Tests: factory, transforms, connection rules, round-trip (if persisted).
- [ ] In-browser: renders, drags, connects (valid/invalid), persists.
- [ ] No console warnings (type-not-found / duplicate keys / missing provider).
- [ ] Run through `references/production-checklist.md`.
