#!/usr/bin/env bash
# Validate the react-flow-expert skill package structure and basic conventions.
# Usage: bash scripts/validate-skill-structure.sh   (run from the skill root or anywhere)
set -euo pipefail

# Resolve the skill root as the parent dir of this script's directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

fail=0
ok()   { printf '  ok   %s\n' "$1"; }
err()  { printf '  MISS %s\n' "$1"; fail=1; }

check_file() { [ -f "${ROOT}/$1" ] && ok "$1" || err "$1"; }

EXPECTED=(
  "SKILL.md"
  "references/architecture-and-project-layout.md"
  "references/setup-and-installation.md"
  "references/core-concepts.md"
  "references/nodes.md"
  "references/edges.md"
  "references/handles-and-connection-rules.md"
  "references/state-management-and-events.md"
  "references/layout-and-positioning.md"
  "references/custom-nodes-and-custom-edges.md"
  "references/styling-theming-and-ux.md"
  "references/performance-and-scaling.md"
  "references/debugging-and-common-failures.md"
  "references/testing-and-validation.md"
  "references/production-checklist.md"
  "examples/minimal-controlled-flow.tsx"
  "examples/custom-node-example.tsx"
  "examples/custom-edge-example.tsx"
  "examples/node-registry-pattern.ts"
  "examples/flow-state-store-example.ts"
  "examples/layout-integration-example.ts"
  "examples/troubleshooting-example.md"
  "templates/flow-shell.tsx"
  "templates/custom-node.tsx"
  "templates/custom-edge.tsx"
  "templates/node-data-types.ts"
  "templates/edge-data-types.ts"
  "templates/flow-hooks.ts"
  "templates/feature-checklist.md"
)

echo "Checking required files under: ${ROOT}"
for f in "${EXPECTED[@]}"; do check_file "$f"; done

# SKILL.md must have YAML frontmatter with name + description.
echo "Checking SKILL.md frontmatter..."
if head -1 "${ROOT}/SKILL.md" | grep -q '^---$' \
   && grep -q '^name: react-flow-expert$' "${ROOT}/SKILL.md" \
   && grep -q '^description:' "${ROOT}/SKILL.md"; then
  ok "frontmatter (name + description present)"
else
  err "SKILL.md frontmatter (need '---', 'name: react-flow-expert', 'description:')"
fi

# Guard against the legacy package name leaking into CODE files (.ts/.tsx).
# Markdown prose intentionally mentions 'reactflow' as a warning, so exclude it.
echo "Checking for legacy 'reactflow' imports in code files (should be @xyflow/react)..."
if grep -rEn --include='*.ts' --include='*.tsx' "from ['\"]reactflow['\"]" "${ROOT}" >/dev/null 2>&1; then
  err "found legacy 'reactflow' import in a code file — use '@xyflow/react'"
  grep -rEn --include='*.ts' --include='*.tsx' "from ['\"]reactflow['\"]" "${ROOT}" || true
else
  ok "no legacy 'reactflow' imports in code files"
fi

if [ "$fail" -eq 0 ]; then
  echo "PASS: react-flow-expert structure is valid."
else
  echo "FAIL: structure issues above."; exit 1
fi
