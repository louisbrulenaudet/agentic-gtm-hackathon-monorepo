// Custom node with typed data — presentational, memoized, updates via updateNodeData.
// Before modifying: read references/nodes.md and references/custom-nodes-and-custom-edges.md.

import { memo } from 'react';
import {
  Handle,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from '@xyflow/react';

// 1. Typed data + node alias (would normally live in types/flow.ts).
export type TextNodeData = { label: string; value: string };
export type TextNode = Node<TextNodeData, 'text'>;

// 2. Presentational component. memo() is required (React Flow re-renders nodes often).
export const TextNodeComponent = memo(function TextNodeComponent({
  id,
  data,
  selected,
}: NodeProps<TextNode>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 8,
        border: `1px solid ${selected ? 'var(--xy-selection-border, #3b82f6)' : '#cbd5e1'}`,
        background: 'var(--xy-node-background-color-default, #fff)',
        minWidth: 160,
      }}
    >
      {/* target handle = connections END here */}
      <Handle type="target" position={Position.Top} />

      <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
        {data.label}
      </label>

      <input
        className="nodrag" // without nodrag, typing/dragging moves the node
        value={data.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
        style={{ width: '100%' }}
      />

      {/* source handle = connections START here */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
