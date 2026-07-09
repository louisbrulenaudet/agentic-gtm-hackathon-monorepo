import type { FlueEvent } from "@flue/sdk";
import { FlowNodeKind } from "@enums/flow-node-kind";
import { describe, expect, it } from "vitest";
import { buildGraphFromEvents } from "@/lib/flow/event-graph";
import { layoutRunGraph } from "@/lib/flow/layout";

/** Minimal event stubs for graph reduction tests. */
function fixtureEvents(
  ...events: Record<string, unknown>[]
): readonly FlueEvent[] {
  return events as unknown as FlueEvent[];
}

function edgeTargets(
  graph: ReturnType<typeof buildGraphFromEvents>,
  source: string,
): string[] {
  return graph.edges
    .filter((edge) => edge.source === source)
    .map((edge) => edge.target);
}

function nodeById(graph: ReturnType<typeof buildGraphFromEvents>, id: string) {
  return graph.nodes.find((node) => node.id === id);
}

describe("buildGraphFromEvents", () => {
  it("fans parallel harness tasks out from the workflow root, not orchestrator", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:tech",
        session: "task-child-tech",
        taskId: "task-tech",
        agent: "techstack_prober",
        prompt: "Probe acme.com",
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:scout",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
    );

    const graph = buildGraphFromEvents(events);

    expect(edgeTargets(graph, "run")).toEqual(
      expect.arrayContaining(["task:task-tech", "task:task-scout"]),
    );
    expect(graph.nodes.some((node) => node.id === "orchestrator")).toBe(false);
    expect(nodeById(graph, "task:task-tech")?.data.label).toBe(
      "techstack_prober",
    );
    expect(nodeById(graph, "task:task-scout")?.data.label).toBe("signal_scout");
  });

  it("builds workflow → sub-agent → tool hierarchy", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:scout",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
      {
        type: "tool_start",
        session: "task-child-scout",
        parentSession: "scan:acme.com:scout",
        taskId: "task-scout",
        toolCallId: "tool-sillage",
        toolName: "mcp__sillage__sillage_v2_list_signals",
        args: { limit: 5 },
      },
    );

    const graph = buildGraphFromEvents(events);

    expect(edgeTargets(graph, "run")).toContain("task:task-scout");
    expect(edgeTargets(graph, "task:task-scout")).toContain(
      "tool:tool-sillage",
    );
    expect(graph.nodes.some((node) => node.id === "orchestrator")).toBe(false);
    expect(nodeById(graph, "tool:tool-sillage")?.data.kind).toBe(
      FlowNodeKind.MCP_TOOL,
    );
  });

  it("builds orchestrator → sub-agent → tool when the orchestrator delegates", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "agent_start",
        session: "orch-session",
        agentName: "orchestrator",
      },
      {
        type: "task_start",
        parentSession: "orch-session",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
      {
        type: "tool_start",
        session: "task-child-scout",
        parentSession: "orch-session",
        taskId: "task-scout",
        toolCallId: "tool-sillage",
        toolName: "mcp__sillage__sillage_v2_list_signals",
        args: {},
      },
    );

    const graph = buildGraphFromEvents(events);

    expect(edgeTargets(graph, "orchestrator")).toContain("task:task-scout");
    expect(edgeTargets(graph, "task:task-scout")).toContain(
      "tool:tool-sillage",
    );
    expect(edgeTargets(graph, "orchestrator")).not.toContain(
      "tool:tool-sillage",
    );
  });

  it("creates orchestrator only when synthesis runs", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:tech",
        session: "task-child-tech",
        taskId: "task-tech",
        agent: "techstack_prober",
        prompt: "Probe acme.com",
      },
      {
        type: "turn",
        session: "orch-session",
        agentName: "orchestrator",
        request: {
          requestedModel: "cloudflare-ai-gateway/anthropic/claude-opus-4-8",
        },
        response: { usage: { totalTokens: 1200 } },
      },
    );

    const graph = buildGraphFromEvents(events);

    expect(nodeById(graph, "orchestrator")).toBeDefined();
    expect(edgeTargets(graph, "run")).toContain("orchestrator");
    expect(edgeTargets(graph, "run")).toContain("task:task-tech");
  });

  it("nests tools under an active skill operation", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:scout",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
      {
        type: "operation_start",
        session: "task-child-scout",
        taskId: "task-scout",
        operationId: "op-skill",
        operationKind: "skill",
      },
      {
        type: "tool_start",
        session: "task-child-scout",
        taskId: "task-scout",
        toolCallId: "tool-sillage",
        toolName: "mcp__sillage__sillage_v2_list_signals",
        args: {},
      },
      {
        type: "operation",
        session: "task-child-scout",
        operationId: "op-skill",
        operationKind: "skill",
        durationMs: 120,
        isError: false,
      },
    );

    const graph = buildGraphFromEvents(events);

    expect(edgeTargets(graph, "task:task-scout")).toContain("skill:op-skill");
    expect(edgeTargets(graph, "skill:op-skill")).toContain("tool:tool-sillage");
  });

  it("assigns distinct Dagre positions to parallel siblings", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:tech",
        session: "task-child-tech",
        taskId: "task-tech",
        agent: "techstack_prober",
        prompt: "Probe acme.com",
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:scout",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
      {
        type: "tool_start",
        session: "task-child-tech",
        taskId: "task-tech",
        toolCallId: "tool-dns",
        toolName: "analyze_domain",
        args: { domain: "acme.com" },
      },
      {
        type: "tool_start",
        session: "task-child-scout",
        taskId: "task-scout",
        toolCallId: "tool-sillage",
        toolName: "mcp__sillage__sillage_v2_list_signals",
        args: {},
      },
    );

    const { nodes } = layoutRunGraph(buildGraphFromEvents(events));
    const positions = nodes.map(
      (node) => `${node.position.x},${node.position.y}`,
    );

    expect(new Set(positions).size).toBe(positions.length);
  });

  it("captures task errors in preview and detail sections", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:enrich",
        session: "task-child-enrich",
        taskId: "task-enrich",
        agent: "contact_enricher",
        prompt: "Enrich Jane Doe",
      },
      {
        type: "task",
        taskId: "task-enrich",
        durationMs: 201,
        isError: true,
        error: { name: "FullenrichError", message: "API key invalid" },
      },
    );

    const node = nodeById(buildGraphFromEvents(events), "task:task-enrich");

    expect(node?.data.status).toBe("failed");
    expect(node?.data.description).toMatch(/enrichissement/i);
    expect(node?.data.previewFields.some((f) => f.label === "error")).toBe(
      true,
    );
    expect(
      node?.data.detailSections.some(
        (s) => s.label === "error" && s.value !== undefined,
      ),
    ).toBe(true);
  });

  it("adds Sillage MCP description and subtitle on tool nodes", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:scout",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
      {
        type: "tool_start",
        session: "task-child-scout",
        taskId: "task-scout",
        toolCallId: "tool-sillage",
        toolName: "mcp__sillage__sillage_v2_list_signals",
        args: { limit: 5 },
      },
    );

    const tool = nodeById(buildGraphFromEvents(events), "tool:tool-sillage");

    expect(tool?.data.description).toMatch(/Sillage/i);
    expect(tool?.data.subtitle).toBe("Sillage · sillage_v2_list_signals");
  });

  it("builds scout result previews with signal and decision-maker counts", () => {
    const events = fixtureEvents(
      {
        type: "run_start",
        workflowName: "prospect-scan",
        input: { domains: ["acme.com"] },
      },
      {
        type: "task_start",
        parentSession: "scan:acme.com:scout",
        session: "task-child-scout",
        taskId: "task-scout",
        agent: "signal_scout",
        prompt: "Scout acme.com",
      },
      {
        type: "task",
        taskId: "task-scout",
        durationMs: 1200,
        isError: false,
        result: {
          domain: "acme.com",
          companyName: "Acme Corp",
          signals: [{}, {}, {}],
          decisionMakers: [{}, {}],
        },
      },
    );

    const node = nodeById(buildGraphFromEvents(events), "task:task-scout");
    const labels = node?.data.previewFields.map((f) => f.label) ?? [];

    expect(labels).toContain("signaux");
    expect(labels).toContain("décideurs");
    expect(
      node?.data.previewFields.find((f) => f.label === "signaux")?.value,
    ).toBe("3 signaux");
    expect(
      node?.data.previewFields.find((f) => f.label === "décideurs")?.value,
    ).toBe("2 décideurs");
  });
});
