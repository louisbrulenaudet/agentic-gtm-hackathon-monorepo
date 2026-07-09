import type { NodeTypes } from "@xyflow/react";
import { FlowNodeKind } from "@enums/flow-node-kind";
import { AgentNode } from "./nodes/agent-node";
import { SubagentNode } from "./nodes/subagent-node";
import { ToolNode } from "./nodes/tool-node";
import { WorkflowNode } from "./nodes/workflow-node";

/**
 * Module-scope node registry: maps each `FlowNodeKind` (used as the React Flow
 * node `type`) to its presentational component. Defined once so its identity is
 * stable across renders — recreating this map would force every node to
 * remount.
 */
export const nodeTypes: NodeTypes = {
  [FlowNodeKind.WORKFLOW]: WorkflowNode,
  [FlowNodeKind.ORCHESTRATOR]: AgentNode,
  [FlowNodeKind.SUBAGENT]: SubagentNode,
  [FlowNodeKind.TOOL]: ToolNode,
  [FlowNodeKind.MCP_TOOL]: ToolNode,
};
