// TEMPLATE: reusable flow hooks. Wrap common operations so components stay thin
// and imperative React Flow access is centralized.
// Read references/state-management-and-events.md before adapting.

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { AppNode } from '../types/flow';

/**
 * Add a node at a screen position (e.g. where the user dropped / clicked).
 * screenToFlowPosition converts pointer coords -> flow coords (viewport-aware).
 */
export function useAddNodeAtPointer() {
  const { screenToFlowPosition, addNodes } = useReactFlow<AppNode>();

  return useCallback(
    (factory: (pos: { x: number; y: number }) => AppNode, clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      addNodes(factory(position));
    },
    [screenToFlowPosition, addNodes],
  );
}

/** Patch a single node's data immutably (cheaper than rebuilding the array). */
export function useUpdateNode() {
  const { updateNodeData } = useReactFlow<AppNode>();
  return useCallback(
    (id: string, patch: Partial<AppNode['data']>) => updateNodeData(id, patch),
    [updateNodeData],
  );
}

/** Delete nodes/edges by id. */
export function useDeleteElements() {
  const { deleteElements } = useReactFlow();
  return useCallback(
    (nodeIds: string[] = [], edgeIds: string[] = []) =>
      deleteElements({
        nodes: nodeIds.map((id) => ({ id })),
        edges: edgeIds.map((id) => ({ id })),
      }),
    [deleteElements],
  );
}

/** Serialize the whole flow (nodes + edges + viewport) for persistence. */
export function useSerializeFlow() {
  const { toObject } = useReactFlow<AppNode>();
  return useCallback(() => ({ version: 1, ...toObject() }), [toObject]);
}
