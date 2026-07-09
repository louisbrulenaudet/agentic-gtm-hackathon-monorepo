// TEMPLATE: types/flow.ts — the single source of truth for node shapes.
// Discriminated union by `type` so handlers narrow `data` correctly.
// Read references/nodes.md before adapting.

import type { Node } from '@xyflow/react';

// --- Per-type data contracts ---
export type TextNodeData = { label: string; value: string };
export type DecisionNodeData = { label: string; condition: string };

// --- Node aliases: Node<Data, 'typeString'> ---
export type TextNode = Node<TextNodeData, 'text'>;
export type DecisionNode = Node<DecisionNodeData, 'decision'>;

// --- App-wide union: use this everywhere you handle "some node" ---
export type AppNode = TextNode | DecisionNode;

// Narrowing helper (optional):
export function isTextNode(n: AppNode): n is TextNode {
  return n.type === 'text';
}

// Usage:
//   const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initial);
//   function NodeC({ data }: NodeProps<TextNode>) { /* data: TextNodeData */ }
