// TEMPLATE: custom node. Rename __Type__ / __TypeData__ and adjust fields/handles.
// Read references/nodes.md + references/custom-nodes-and-custom-edges.md before adapting.

import { memo } from 'react';
import {
  Handle,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from '@xyflow/react';

// 1) Data contract (move to types/flow.ts and add to the AppNode union).
export type __TypeData__ = {
  label: string;
  // add your fields here (keep JSON-serializable if the graph is persisted)
};
export type __Type__ = Node<__TypeData__, '__type__'>;

// 2) Presentational, memoized component.
export const __Type__Node = memo(function __Type__Node({
  id,
  data,
  selected,
}: NodeProps<__Type__>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      data-selected={selected || undefined}
      style={{
        padding: 8,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: 'var(--xy-node-background-color-default, #fff)',
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Top} />

      {/* Render from data; emit changes via updateNodeData — never mutate data. */}
      <strong>{data.label}</strong>
      {/* Example editable field:
      <input className="nodrag" value={data.label}
             onChange={(e) => updateNodeData(id, { label: e.target.value })} /> */}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
