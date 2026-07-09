/**
 * The kind of a node in the run-execution graph. Each value doubles as the
 * React Flow node `type` string, so it must match a key in the node registry
 * (`lib/flow/registry.ts`). UI-only — never crosses the wire.
 */
export enum FlowNodeKind {
  /** The workflow run itself (graph root). */
  WORKFLOW = "workflow",
  /** The top-level orchestrator agent. */
  ORCHESTRATOR = "orchestrator",
  /** A delegated sub-agent (Flue `task`). */
  SUBAGENT = "subagent",
  /** A plain tool call (`defineTool`). */
  TOOL = "tool",
  /** A tool call served by an MCP server (`mcp__*`). */
  MCP_TOOL = "mcp_tool",
  /** A Flue skill invocation (`operationKind: skill`). */
  SKILL = "skill",
}
