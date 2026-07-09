// Node/edge registry — the single module-scope source of type-string -> component.
// Before modifying: read references/architecture-and-project-layout.md and references/nodes.md.
//
// Why module scope: passing a fresh nodeTypes/edgeTypes object on each render forces
// React Flow to remount every node/edge. Define ONCE here; import into the canvas.

import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { TextNodeComponent } from './custom-node-example';
import { LabeledEdgeComponent } from './custom-edge-example';

// Keys here MUST match the `type` string on the corresponding node/edge objects.
export const nodeTypes: NodeTypes = {
  text: TextNodeComponent,
};

export const edgeTypes: EdgeTypes = {
  labeled: LabeledEdgeComponent,
};

// Optional: per-type metadata for palettes / add-node menus, kept beside the registry.
export const nodeMeta = {
  text: { label: 'Text', description: 'A free-text input node' },
} as const satisfies Record<keyof typeof nodeTypes, { label: string; description: string }>;
