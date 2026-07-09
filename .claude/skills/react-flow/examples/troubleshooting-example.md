# Worked Troubleshooting Example

A demonstration of the triage protocol from `references/debugging-and-common-failures.md`.

## Report

> "I added React Flow but the page is completely blank. No errors. My nodes array has 3 items."

## Triage

State exists (3 nodes), no errors → not a data bug. Classify candidates: **styling** (CSS) or **rendering** (container size). Check the cheap, high-probability causes first.

### Step 1 — CSS import

```bash
# Is the stylesheet imported anywhere?
grep -rn "@xyflow/react/dist/style.css" src/
```

Found: yes, imported in `main.tsx`. So nodes would be *styled* if rendered. Not the (only) issue.

### Step 2 — Container dimensions

Look at the wrapper:

```tsx
// ❌ BEFORE — parent has no resolved height, canvas collapses to 0px
function Editor() {
  return (
    <div className="editor">
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  );
}
```

`.editor` has no height set, and its ancestors don't establish one → the React Flow canvas is `100% × 0px`. **Blank canvas, no error** — the signature of the #1 rendering bug.

### Fix

```tsx
// ✅ AFTER — explicit height
function Editor() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}
```

### Verify

In the browser: nodes now render and `fitView` frames them; dragging works. Bug confirmed fixed, root cause reported as "zero-height parent container," not guessed.

## Lesson encoded

For any "blank / not rendering" report, check **CSS import → parent size → IDs → registry** in that order *before* touching component logic. Two `grep`s and one DOM inspection resolved it without speculative edits.
