// Custom edge with an interactive label + delete button.
// Before modifying: read references/edges.md and references/custom-nodes-and-custom-edges.md.

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';

export type LabeledEdgeData = { label?: string };
export type LabeledEdge = Edge<LabeledEdgeData, 'labeled'>;

export function LabeledEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<LabeledEdge>) {
  const { setEdges } = useReactFlow();

  // Path helper returns [path, labelX, labelY] — use the anchor for the label.
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          // nodrag nopan: keep canvas still while interacting; pointerEvents:'all' to click.
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: 12,
          }}
        >
          {data?.label && <span style={{ marginRight: 6 }}>{data.label}</span>}
          <button
            type="button"
            onClick={() => setEdges((eds) => eds.filter((e) => e.id !== id))}
            aria-label="Delete edge"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
