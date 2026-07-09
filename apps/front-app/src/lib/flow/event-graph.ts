import type { FlueEvent } from "@flue/sdk";
import { FlowNodeKind } from "@enums/flow-node-kind";
import { FlowNodeStatus } from "@enums/flow-node-status";
import type {
  FlowNodeData,
  FlowNodeDetailSection,
  FlowNodeField,
} from "@/dtos/flow-graph";
import {
  agentDescription,
  mcpToolDescription,
  mcpToolSubtitle,
  toolDescription,
  workflowDescription,
} from "./node-metadata";
import { buildResultPreview, mergePreviewFields } from "./preview";
import { mcpServerName, prettyToolName, summarizeValue } from "./summarize";

/**
 * Pure reduction of a Flue workflow-run event stream into a logical execution
 * tree (workflow → sub-agents → skills → tools). Framework-agnostic and
 * unit-testable: no React, no React Flow, no layout.
 *
 * Parent/child edges are reconstructed from the event envelope:
 *
 * - `taskId` is the strongest link — child task sessions inherit it on every
 *   event emitted inside a delegated sub-agent.
 * - `session` on `task_start` is the **child** session; `parentSession` is the
 *   spawner (workflow harness or orchestrator session).
 * - `parentSession` links a delegated sub-agent back to its spawner.
 * - `toolCallId` correlates a `tool_start`/`tool` pair to the tool node.
 * - `operationId` + `operationKind: skill` create an intermediate skill layer.
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
const ACTIVATE_SKILL_TOOL = "activate_skill";

function settledStatus(isError: boolean): FlowNodeStatus {
  return isError ? FlowNodeStatus.FAILED : FlowNodeStatus.SUCCEEDED;
}

/** Error payload on settled events — `error` when present, else `result`. */
function settledError(event: { isError: boolean; result?: unknown }): unknown {
  if (!event.isError) {
    return undefined;
  }
  if ("error" in event) {
    const errorValue = Reflect.get(event, "error");
    if (errorValue !== undefined) {
      return errorValue;
    }
  }
  return event.result;
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

function mergeDetailSections(
  existing: FlowNodeDetailSection[],
  additions: FlowNodeDetailSection[],
): FlowNodeDetailSection[] {
  if (additions.length === 0) {
    return existing;
  }
  const byLabel = new Map(existing.map((entry) => [entry.label, entry]));
  for (const entry of additions) {
    byLabel.set(entry.label, entry);
  }
  return [...byLabel.values()];
}

function detailSection(label: string, value: unknown): FlowNodeDetailSection[] {
  if (value === undefined || value === null) {
    return [];
  }
  return [{ label, value }];
}

/** Short display label from a harness session id such as `scan:acme.com:scout`. */
function sessionLabel(session: string): string {
  const segments = session.split(":");
  return segments.at(-1) ?? session;
}

function skillNameFromActivateArgs(args: unknown): string | undefined {
  if (!args || typeof args !== "object") {
    return undefined;
  }
  if (
    "skill" in args &&
    typeof args.skill === "string" &&
    args.skill.length > 0
  ) {
    return args.skill;
  }
  if ("name" in args && typeof args.name === "string" && args.name.length > 0) {
    return args.name;
  }
  return undefined;
}

class RunGraphBuilder {
  private readonly nodes = new Map<string, LogicalNode>();
  private readonly edges = new Map<string, LogicalEdge>();
  private readonly nodeBySession = new Map<string, string>();
  private readonly nodeByTask = new Map<string, string>();
  private readonly nodeByToolCall = new Map<string, string>();
  private readonly nodeByOperation = new Map<string, string>();
  /** Context label for smart previews (agent name or tool name). */
  private readonly contextByNode = new Map<string, string>();
  /** Active skill operation per session — tools nest under it while running. */
  private readonly activeSkillBySession = new Map<string, string>();
  private eventIndex = 0;

  build(events: readonly FlueEvent[]): RunGraph {
    for (const event of events) {
      this.apply(event);
      this.eventIndex += 1;
    }
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
    };
  }

  private startedAt(): number {
    return this.eventIndex;
  }

  private isOrchestratorAgent(event: FlueEvent): boolean {
    return event.agentName === "orchestrator";
  }

  private ensureNode(id: string, initial: FlowNodeData): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        data: {
          ...initial,
          fields: initial.fields ?? [],
          previewFields: initial.previewFields ?? [],
          detailSections: initial.detailSections ?? [],
          startedAt: this.startedAt(),
        },
      });
    }
  }

  private patch(
    id: string,
    changes: Partial<
      Pick<
        FlowNodeData,
        "label" | "status" | "subtitle" | "durationMs" | "description"
      >
    >,
    addFields: FlowNodeField[] = [],
    addDetails: FlowNodeDetailSection[] = [],
    addPreviews: FlowNodeField[] = [],
    replacePreviews = false,
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
      ...(changes.description !== undefined
        ? { description: changes.description }
        : {}),
      fields: mergeFields(node.data.fields, addFields),
      detailSections: mergeDetailSections(node.data.detailSections, addDetails),
      previewFields: replacePreviews
        ? mergePreviewFields([], addPreviews)
        : mergePreviewFields(node.data.previewFields, addPreviews),
    };
  }

  private ensureEdge(source: string, target: string): void {
    const id = `${source}->${target}`;
    if (!this.edges.has(id)) {
      this.edges.set(id, { id, source, target });
    }
  }

  private ensureRoot(
    label: string,
    initialFields: FlowNodeField[],
    initialDetails: FlowNodeDetailSection[],
  ): string {
    this.ensureNode(ROOT_ID, {
      kind: FlowNodeKind.WORKFLOW,
      label,
      status: FlowNodeStatus.RUNNING,
      subtitle: "workflow run",
      description: workflowDescription(label),
      fields: initialFields,
      previewFields: initialFields,
      detailSections: initialDetails,
    });
    this.contextByNode.set(ROOT_ID, label);
    return ROOT_ID;
  }

  private ensureOrchestrator(event: FlueEvent): string {
    if (!this.nodes.has(ORCHESTRATOR_ID)) {
      this.ensureNode(ORCHESTRATOR_ID, {
        kind: FlowNodeKind.ORCHESTRATOR,
        label: event.agentName ?? "orchestrator",
        status: FlowNodeStatus.RUNNING,
        subtitle: "orchestrator",
        description: agentDescription("orchestrator"),
        fields: [],
        previewFields: [],
        detailSections: [],
      });
      this.contextByNode.set(ORCHESTRATOR_ID, "orchestrator");
      if (this.nodes.has(ROOT_ID)) {
        this.ensureEdge(ROOT_ID, ORCHESTRATOR_ID);
      }
    }
    return ORCHESTRATOR_ID;
  }

  /** Resolve the spawner for a `task_start` via `parentSession`. */
  private parentForTaskStart(event: FlueEvent): string {
    if (event.parentSession) {
      const known = this.nodeBySession.get(event.parentSession);
      if (known) {
        return known;
      }
    }

    if (this.isOrchestratorAgent(event)) {
      return this.ensureOrchestrator(event);
    }

    return this.nodes.has(ROOT_ID) ? ROOT_ID : this.ensureOrchestrator(event);
  }

  /**
   * Resolve which graph node owns an event. `taskId` wins, then session lookup,
   * then orchestrator only when the agent is actually the orchestrator.
   */
  private resolveOwner(event: FlueEvent): string {
    if (event.taskId) {
      const taskNode = this.nodeByTask.get(event.taskId);
      if (taskNode) {
        return taskNode;
      }
    }

    if (event.session) {
      const session = event.session;
      const known = this.nodeBySession.get(session);
      if (known) {
        return known;
      }

      if (event.parentSession) {
        const parent = this.nodeBySession.get(event.parentSession);
        if (parent) {
          const id = `session:${session}`;
          const agentName = event.agentName ?? sessionLabel(session);
          this.ensureNode(id, {
            kind: FlowNodeKind.SUBAGENT,
            label: agentName,
            status: FlowNodeStatus.RUNNING,
            subtitle: "sub-agent",
            description: agentDescription(agentName),
            fields: [],
            previewFields: [],
            detailSections: [],
          });
          this.contextByNode.set(id, agentName);
          this.ensureEdge(parent, id);
          this.nodeBySession.set(session, id);
          return id;
        }
      }

      if (this.isOrchestratorAgent(event) && !event.taskId) {
        const orchestrator = this.ensureOrchestrator(event);
        this.nodeBySession.set(session, orchestrator);
        return orchestrator;
      }

      const id = `session:${session}`;
      const agentName = event.agentName ?? sessionLabel(session);
      this.ensureNode(id, {
        kind: FlowNodeKind.SUBAGENT,
        label: agentName,
        status: FlowNodeStatus.RUNNING,
        subtitle: "sub-agent",
        description: agentDescription(agentName),
        fields: [],
        previewFields: [],
        detailSections: [],
      });
      this.contextByNode.set(id, agentName);
      const parent = this.nodes.has(ROOT_ID) ? ROOT_ID : undefined;
      if (parent) {
        this.ensureEdge(parent, id);
      }
      this.nodeBySession.set(session, id);
      return id;
    }

    if (this.isOrchestratorAgent(event)) {
      return this.ensureOrchestrator(event);
    }

    return this.nodes.has(ROOT_ID) ? ROOT_ID : this.ensureOrchestrator(event);
  }

  /** Parent for a tool — may nest under an active skill operation. */
  private parentForTool(event: FlueEvent): string {
    const session = event.session;
    if (session) {
      const activeSkill = this.activeSkillBySession.get(session);
      if (activeSkill) {
        return activeSkill;
      }
    }
    return this.resolveOwner(event);
  }

  private apply(event: FlueEvent): void {
    switch (event.type) {
      case "run_start": {
        const inputFields = field("input", event.input);
        this.ensureRoot(
          event.workflowName,
          inputFields,
          detailSection("input", event.input),
        );
        break;
      }
      case "run_resume": {
        this.ensureRoot(event.workflowName, [], []);
        break;
      }
      case "run_end": {
        const resultFields = field("result", event.result);
        const errorFields = event.isError ? field("error", event.error) : [];
        this.patch(
          ROOT_ID,
          {
            status: settledStatus(event.isError),
            durationMs: event.durationMs,
          },
          [...resultFields, ...errorFields],
          [
            ...detailSection("result", event.result),
            ...(event.isError ? detailSection("error", event.error) : []),
          ],
          [
            ...resultFields,
            ...errorFields,
            ...buildResultPreview(
              this.contextByNode.get(ROOT_ID) ?? "prospect-scan",
              event.result,
            ),
          ],
        );
        if (this.nodes.has(ORCHESTRATOR_ID)) {
          this.patch(ORCHESTRATOR_ID, {
            status: settledStatus(event.isError),
          });
        }
        break;
      }
      case "agent_start": {
        const owner = this.resolveOwner(event);
        if (event.session) {
          this.nodeBySession.set(event.session, owner);
        }
        break;
      }
      case "agent_end": {
        this.patch(this.resolveOwner(event), {
          status: FlowNodeStatus.SUCCEEDED,
        });
        break;
      }
      case "turn": {
        const owner = this.resolveOwner(event);
        const modelFields = field("model", event.request.requestedModel);
        const tokenFields = field("tokens", event.response.usage?.totalTokens);
        this.patch(
          owner,
          {},
          [...modelFields, ...tokenFields],
          [
            ...detailSection("model", event.request.requestedModel),
            ...detailSection("tokens", event.response.usage?.totalTokens),
          ],
          [...modelFields, ...tokenFields],
        );
        break;
      }
      case "task_start": {
        const parent = this.parentForTaskStart(event);
        const id = `task:${event.taskId}`;
        const agentName = event.agent ?? "sub-agent";
        const promptFields = field("prompt", event.prompt);
        this.ensureNode(id, {
          kind: FlowNodeKind.SUBAGENT,
          label: agentName,
          status: FlowNodeStatus.RUNNING,
          subtitle: "sub-agent",
          description: agentDescription(agentName),
          fields: promptFields,
          previewFields: promptFields,
          detailSections: detailSection("prompt", event.prompt),
        });
        this.contextByNode.set(id, agentName);
        this.nodeByTask.set(event.taskId, id);
        this.ensureEdge(parent, id);
        if (event.session) {
          this.nodeBySession.set(event.session, id);
        }
        break;
      }
      case "task": {
        const id = this.nodeByTask.get(event.taskId);
        if (id) {
          const context = this.contextByNode.get(id) ?? "";
          const errorPayload = settledError(event);
          const resultFields = event.isError
            ? []
            : field("result", event.result);
          const errorFields = event.isError ? field("error", errorPayload) : [];
          this.patch(
            id,
            {
              status: settledStatus(event.isError),
              durationMs: event.durationMs,
            },
            [...resultFields, ...errorFields],
            [
              ...detailSection("result", event.result),
              ...(event.isError ? detailSection("error", errorPayload) : []),
            ],
            [
              ...errorFields,
              ...buildResultPreview(
                context,
                event.isError ? undefined : event.result,
              ),
            ],
            true,
          );
        }
        break;
      }
      case "operation_start": {
        if (event.operationKind !== "skill") {
          break;
        }
        const owner = this.resolveOwner(event);
        const id = `skill:${event.operationId}`;
        this.ensureNode(id, {
          kind: FlowNodeKind.SKILL,
          label: "skill",
          status: FlowNodeStatus.RUNNING,
          subtitle: "skill",
          description: "Exécution d'une skill Flue",
          fields: [],
          previewFields: [],
          detailSections: [],
        });
        this.contextByNode.set(id, "skill");
        this.nodeByOperation.set(event.operationId, id);
        this.ensureEdge(owner, id);
        if (event.session) {
          this.activeSkillBySession.set(event.session, id);
        }
        break;
      }
      case "operation": {
        if (event.operationKind !== "skill") {
          break;
        }
        const id = this.nodeByOperation.get(event.operationId);
        if (id) {
          const errorPayload = settledError(event);
          const resultFields = event.isError
            ? []
            : field("result", event.result);
          const errorFields = event.isError ? field("error", errorPayload) : [];
          this.patch(
            id,
            {
              status: settledStatus(event.isError),
              durationMs: event.durationMs,
            },
            [...resultFields, ...errorFields],
            [
              ...detailSection("result", event.result),
              ...(event.isError ? detailSection("error", errorPayload) : []),
            ],
            [...resultFields, ...errorFields],
          );
        }
        if (event.session) {
          this.activeSkillBySession.delete(event.session);
        }
        break;
      }
      case "tool_start": {
        if (event.toolName === ACTIVATE_SKILL_TOOL) {
          const skillName = skillNameFromActivateArgs(event.args) ?? "skill";
          const owner = this.resolveOwner(event);
          const id = `skill:${event.toolCallId}`;
          const argsFields = field("args", event.args);
          this.ensureNode(id, {
            kind: FlowNodeKind.SKILL,
            label: skillName,
            status: FlowNodeStatus.RUNNING,
            subtitle: "skill",
            description: `Skill · ${skillName}`,
            fields: argsFields,
            previewFields: argsFields,
            detailSections: detailSection("args", event.args),
          });
          this.contextByNode.set(id, skillName);
          this.ensureEdge(owner, id);
          break;
        }

        const owner = this.parentForTool(event);
        const id = `tool:${event.toolCallId}`;
        const isMcp = event.toolName.startsWith("mcp__");
        const argsFields = field("args", event.args);
        this.ensureNode(id, {
          kind: isMcp ? FlowNodeKind.MCP_TOOL : FlowNodeKind.TOOL,
          label: prettyToolName(event.toolName),
          status: FlowNodeStatus.RUNNING,
          subtitle: isMcp
            ? mcpToolSubtitle(event.toolName)
            : (mcpServerName(event.toolName) ?? "tool"),
          description: isMcp
            ? mcpToolDescription(event.toolName)
            : toolDescription(event.toolName),
          fields: argsFields,
          previewFields: argsFields,
          detailSections: detailSection("args", event.args),
        });
        this.contextByNode.set(id, event.toolName);
        this.nodeByToolCall.set(event.toolCallId, id);
        this.ensureEdge(owner, id);
        break;
      }
      case "tool": {
        if (event.toolName === ACTIVATE_SKILL_TOOL) {
          const id = `skill:${event.toolCallId}`;
          const errorPayload = settledError(event);
          const resultFields = event.isError
            ? []
            : field("result", event.result);
          const errorFields = event.isError ? field("error", errorPayload) : [];
          this.patch(
            id,
            {
              status: settledStatus(event.isError),
              durationMs: event.durationMs,
            },
            [...resultFields, ...errorFields],
            [
              ...detailSection("result", event.result),
              ...(event.isError ? detailSection("error", errorPayload) : []),
            ],
            [...resultFields, ...errorFields],
          );
          break;
        }

        const id = this.nodeByToolCall.get(event.toolCallId);
        if (id) {
          const context = this.contextByNode.get(id) ?? "";
          const errorPayload = settledError(event);
          const resultFields = event.isError
            ? []
            : field("result", event.result);
          const errorFields = event.isError ? field("error", errorPayload) : [];
          this.patch(
            id,
            {
              status: settledStatus(event.isError),
              durationMs: event.durationMs,
            },
            [...resultFields, ...errorFields],
            [
              ...detailSection("result", event.result),
              ...(event.isError ? detailSection("error", errorPayload) : []),
            ],
            [
              ...errorFields,
              ...buildResultPreview(
                context,
                event.isError ? undefined : event.result,
              ),
            ],
            true,
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
