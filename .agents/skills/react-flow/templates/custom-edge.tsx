// TEMPLATE: custom edge. Rename __Edge__ / __EdgeData__ and choose a path helper.
// Read references/edges.md + references/custom-nodes-and-custom-edges.md before adapting.

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath, // or getBezierPath / getStraightPath
  type Edge,
  type EdgeProps,
} from '@xyflow/react';

export type __EdgeData__ = {
  label?: string;
};
export type __Edge__ = Edge<__EdgeData__, '__edge__'>;

export function __Edge__Component({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<__Edge__>) {
  const [path, labelX, labelY] = getSmoothStepPath({
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
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
