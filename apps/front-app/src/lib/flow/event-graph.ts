import type { FlueEvent } from "@flue/sdk";
import { FlowNodeKind } from "@enums/flow-node-kind";
import { FlowNodeStatus } from "@enums/flow-node-status";
import type { FlowNodeData, FlowNodeField } from "@/dtos/flow-graph";
import { mcpServerName, prettyToolName, summarizeValue } from "./summarize";

/**
 * Pure reduction of a Flue workflow-run event stream into a logical execution
 * graph (orchestrator → sub-agents → tools/MCP). Framework-agnostic and
 * unit-testable: no React, no React Flow, no layout. Positioning + React Flow
 * mapping live in `layout.ts` / `node-factory.ts`.
 *
 * Parent/child edges are reconstructed from the event envelope:
 *
 * - `session` identifies the agent context an event ran in.
 * - `parentSession` links a delegated sub-agent back to its spawner.
 * - `taskId` correlates a `task_start`/`task` delegation to the sub-agent node.
 * - `toolCallId` correlates a `tool_start`/`tool` pair to the tool node.
 */

export interface LogicalNode {
  id: string;
  data: FlowNodeData;
}

export interface LogicalEdge {
  id: string;
  source: string;
  target: string;
}

export interface RunGraph {
  nodes: LogicalNode[];
  edges: LogicalEdge[];
}

const ROOT_ID = "run";
const ORCHESTRATOR_ID = "orchestrator";

function settledStatus(isError: boolean): FlowNodeStatus {
  return isError ? FlowNodeStatus.FAILED : FlowNodeStatus.SUCCEEDED;
}

/** One node field, or none when the value summarizes to an empty string. */
function field(label: string, value: unknown): FlowNodeField[] {
  const summary = summarizeValue(value);
  return summary ? [{ label, value: summary }] : [];
}

function mergeFields(
  existing: FlowNodeField[],
  additions: FlowNodeField[],
): FlowNodeField[] {
  if (additions.length === 0) {
    return existing;
  }
  const byLabel = new Map(existing.map((entry) => [entry.label, entry]));
  for (const entry of additions) {
    byLabel.set(entry.label, entry);
  }
  return [...byLabel.values()];
}

class RunGraphBuilder {
  private readonly nodes = new Map<string, LogicalNode>();
  private readonly edges = new Map<string, LogicalEdge>();
  private readonly nodeBySession = new Map<string, string>();
  private readonly nodeByTask = new Map<string, string>();
  private readonly nodeByToolCall = new Map<string, string>();

  build(events: readonly FlueEvent[]): RunGraph {
    for (const event of events) {
      this.apply(event);
    }
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
    };
  }

  private ensureNode(id: string, initial: FlowNodeData): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, data: initial });
    }
  }

  private patch(
    id: string,
    changes: Partial<
      Pick<FlowNodeData, "label" | "status" | "subtitle" | "durationMs">
    >,
    addFields: FlowNodeField[] = [],
  ): void {
    const node = this.nodes.get(id);
    if (!node) {
      return;
    }
    node.data = {
      ...node.data,
      ...(changes.label !== undefined ? { label: changes.label } : {}),
      ...(changes.status !== undefined ? { status: changes.status } : {}),
      ...(changes.subtitle !== undefined ? { subtitle: changes.subtitle } : {}),
      ...(changes.durationMs !== undefined
        ? { durationMs: changes.durationMs }
        : {}),
      fields: mergeFields(node.data.fields, addFields),
    };
  }

  private ensureEdge(source: string, target: string): void {
    const id = `${source}->${target}`;
    if (!this.edges.has(id)) {
      this.edges.set(id, { id, source, target });
    }
  }

  private ensureRoot(label: string, initialFields: FlowNodeField[]): string {
    this.ensureNode(ROOT_ID, {
      kind: FlowNodeKind.WORKFLOW,
      label,
      status: FlowNodeStatus.RUNNING,
      subtitle: "workflow run",
      fields: initialFields,
    });
    return ROOT_ID;
  }

  private ensureOrchestrator(event: FlueEvent): string {
    if (!this.nodes.has(ORCHESTRATOR_ID)) {
      this.ensureNode(ORCHESTRATOR_ID, {
        kind: FlowNodeKind.ORCHESTRATOR,
        label: event.agentName ?? "orchestrator",
        status: FlowNodeStatus.RUNNING,
        subtitle: "orchestrator",
        fields: [],
      });
      if (this.nodes.has(ROOT_ID)) {
        this.ensureEdge(ROOT_ID, ORCHESTRATOR_ID);
      }
    }
    return ORCHESTRATOR_ID;
  }

  /** Map an event's `session` to the node it belongs to, creating it if needed. */
  private registerSession(event: FlueEvent): string {
    const session = event.session;
    if (!session) {
      return this.ensureOrchestrator(event);
    }
    const known = this.nodeBySession.get(session);
    if (known) {
      return known;
    }

    // Sub-agent session created by a delegation we already saw.
    if (event.taskId) {
      const taskNode = this.nodeByTask.get(event.taskId);
      if (taskNode) {
        this.nodeBySession.set(session, taskNode);
        return taskNode;
      }
    }

    // Sub-agent session whose parent is known but delegation was not seen.
    if (event.parentSession) {
      const parent = this.nodeBySession.get(event.parentSession);
      if (parent) {
        const id = `session:${session}`;
        this.ensureNode(id, {
          kind: FlowNodeKind.SUBAGENT,
          label: event.agentName ?? "sub-agent",
          status: FlowNodeStatus.RUNNING,
          subtitle: "sub-agent",
          fields: [],
        });
        this.ensureEdge(parent, id);
        this.nodeBySession.set(session, id);
        return id;
      }
    }

    // Top-level session — the orchestrator.
    const orchestrator = this.ensureOrchestrator(event);
    this.nodeBySession.set(session, orchestrator);
    return orchestrator;
  }

  private ownerFor(event: FlueEvent): string {
    if (event.session) {
      return this.registerSession(event);
    }
    return this.ensureOrchestrator(event);
  }

  private apply(event: FlueEvent): void {
    switch (event.type) {
      case "run_start": {
        this.ensureRoot(event.workflowName, field("input", event.input));
        break;
      }
      case "run_resume": {
        this.ensureRoot(event.workflowName, []);
        break;
      }
      case "run_end": {
        this.patch(
          ROOT_ID,
          {
            status: settledStatus(event.isError),
            durationMs: event.durationMs,
          },
          [
            ...field("result", event.result),
            ...(event.isError ? field("error", event.error) : []),
          ],
        );
        // The orchestrator has no per-node settle event of its own; reconcile
        // it to the run's terminal state so it stops showing as running.
        this.patch(ORCHESTRATOR_ID, { status: settledStatus(event.isError) });
        break;
      }
      case "agent_start": {
        this.ownerFor(event);
        break;
      }
      case "agent_end": {
        // An agent's turn loop finished successfully; a later `task`/`run_end`
        // may still override a sub-agent/root to a failed state.
        this.patch(this.ownerFor(event), {
          status: FlowNodeStatus.SUCCEEDED,
        });
        break;
      }
      case "turn": {
        const owner = this.ownerFor(event);
        this.patch(owner, {}, [
          ...field("model", event.request.requestedModel),
          ...field("tokens", event.response.usage?.totalTokens),
        ]);
        break;
      }
      case "task_start": {
        const parent = this.ownerFor(event);
        const id = `task:${event.taskId}`;
        this.ensureNode(id, {
          kind: FlowNodeKind.SUBAGENT,
          label: event.agent ?? "sub-agent",
          status: FlowNodeStatus.RUNNING,
          subtitle: "sub-agent",
          fields: field("prompt", event.prompt),
        });
        this.nodeByTask.set(event.taskId, id);
        this.ensureEdge(parent, id);
        break;
      }
      case "task": {
        const id = this.nodeByTask.get(event.taskId);
        if (id) {
          this.patch(
            id,
            {
              status: settledStatus(event.isError),
              durationMs: event.durationMs,
            },
            field("result", event.result),
          );
        }
        break;
      }
      case "tool_start": {
        const owner = this.ownerFor(event);
        const id = `tool:${event.toolCallId}`;
        const isMcp = event.toolName.startsWith("mcp__");
        this.ensureNode(id, {
          kind: isMcp ? FlowNodeKind.MCP_TOOL : FlowNodeKind.TOOL,
          label: prettyToolName(event.toolName),
          status: FlowNodeStatus.RUNNING,
          subtitle: isMcp ? mcpServerName(event.toolName) : "tool",
          fields: field("args", event.args),
        });
        this.nodeByToolCall.set(event.toolCallId, id);
        this.ensureEdge(owner, id);
        break;
      }
      case "tool": {
        const id = this.nodeByToolCall.get(event.toolCallId);
        if (id) {
          this.patch(
            id,
            {
              status: settledStatus(event.isError),
              durationMs: event.durationMs,
            },
            field("result", event.result),
          );
        }
        break;
      }
      default:
        break;
    }
  }
}

/** Build the logical run graph from the full (ordered) event list. */
export function buildGraphFromEvents(events: readonly FlueEvent[]): RunGraph {
  return new RunGraphBuilder().build(events);
}
