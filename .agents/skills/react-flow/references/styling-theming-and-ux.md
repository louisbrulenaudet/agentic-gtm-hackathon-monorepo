# Styling, Theming & UX

**Covers:** stylesheet loading, theming with `colorMode` and CSS variables, utility classes, accessibility, selection/hover/focus affordances, zoom readability, and interaction polish.

**Read when:** styling nodes/edges, building dark mode, ensuring a11y, or polishing interaction feel.

## 1. Stylesheet (prerequisite)

`@xyflow/react/dist/style.css` must be imported (Tailwind v4: in the global stylesheet, after the Tailwind layers — see [setup-and-installation.md](./setup-and-installation.md)). Everything below assumes it's loaded.

## 2. Theming

### `colorMode` prop

```tsx
<ReactFlow colorMode="dark" /* 'light' | 'dark' | 'system' */ ... />
```

`'system'` follows the OS preference. This switches React Flow's built-in surfaces (controls, minimap, edges) to the matching palette.

### CSS variables

React Flow exposes `--xy-*` variables defined under `.react-flow` and `:root`. Override them to theme without fighting specificity:

```css
.react-flow {
  --xy-node-background-color-default: #1e1e2e;
  --xy-edge-stroke-default: #6c7086;
  --xy-handle-background-color-default: #89b4fa;
}
```

Prefer overriding variables and your own node classes over deep `!important` overrides of internal classes.

### Class overrides

Built-in classes you can target: `.react-flow__node`, `.react-flow__edge`, `.react-flow__handle`, `.react-flow__controls`, `.react-flow__minimap`, etc. Use for structural tweaks; use variables for color.

## 3. Utility classes (interaction control)

React Flow provides element-level classes to control pointer behavior inside nodes/edges:

- **`nodrag`** — element won't initiate a node drag (put on inputs, buttons, sliders).
- **`nopan`** — clicking/dragging won't pan the canvas (put on interactive overlays, edge labels).
- **`nowheel`** — wheel events scroll the element instead of zooming the canvas (put on scrollable node content).

Omitting these is the cause of "I can't type in my node" / "scrolling zooms the whole canvas."

## 4. Design tokens & consistency

- Drive node/edge colors from CSS variables / your design tokens so light/dark and `colorMode` stay consistent.
- Build a small set of node "kinds" (status colors, sizes) rather than ad-hoc per-node styling.
- Keep node visuals **lightweight** — heavy shadows/gradients/filters multiplied across hundreds of nodes hurt performance (see [performance-and-scaling.md](./performance-and-scaling.md)).

## 5. Selection / hover / focus affordances

- Read `selected` from `NodeProps`/`EdgeProps` to render a selection ring; don't rely on color alone (a11y).
- Provide hover affordance on handles (enlarge / highlight) so connection points are discoverable and easy to hit.
- Keep handles large enough to click comfortably; tiny handles are a common UX complaint.

## 6. Accessibility

- React Flow ships keyboard support: nodes/edges are focusable and movable via keyboard; respect it — don't trap focus or remove outlines without replacement.
- Provide text/`aria-label`s for icon-only nodes and controls.
- Ensure color contrast for node text and selection states in both color modes.
- Don't disable focus styles; if you restyle, keep a visible focus indicator.

## 7. Zoom readability

- Content shrinks as users zoom out. For dense graphs, consider simplifying node rendering at low zoom (show label only) using `useViewport()` zoom level, or rely on the `<MiniMap />` for overview.
- Keep critical labels legible at the default zoom; don't depend on users zooming in to read essential info.

## 8. Built-in UX components

- `<Controls />` — zoom/fit/lock buttons. `<MiniMap />` — overview + navigation (drop for tiny flows). `<Background />` — dots/lines grid. `<Panel position="top-right">` — for custom toolbars. `<NodeToolbar>` / `<NodeResizer>` for per-node affordances.

## Anti-patterns

- Missing `nodrag`/`nowheel`/`nopan` on interactive node content.
- Theming via brittle `!important` overrides instead of `--xy-*` variables.
- Conveying selection/state with color only (no shape/ring/label).
- Removing focus outlines; heavy per-node shadows/filters at scale.

## Agent instructions

1. Use `colorMode` + `--xy-*` variables for theming; override your own classes, not internals, where possible.
2. Always add the correct utility class (`nodrag`/`nowheel`/`nopan`) to interactive node/edge content.
3. Render a non-color selection affordance and keep focus styles.
4. If a design system/token source isn't specified but styling is requested, **ask** which system (Tailwind v4 / CSS Modules / tokens) before committing — it interacts with the setup caveat.
