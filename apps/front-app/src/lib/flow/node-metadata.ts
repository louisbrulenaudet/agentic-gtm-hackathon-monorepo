/** Human-readable roles for graph nodes. Pure lookup — no React. */

const AGENT_DESCRIPTIONS: Record<string, string> = {
  orchestrator: "Orchestration, ranking et synthèse des use cases",
  techstack_prober: "Inférence stack DNS / SPF",
  signal_scout: "Signaux commerciaux Sillage + décideurs",
  contact_enricher: "Enrichissement email / téléphone",
  content_collector: "Collecte de contenu web",
};

const TOOL_DESCRIPTIONS: Record<string, string> = {
  analyze_domain: "Résolution DNS via worker-dns",
  enrich_contact: "Appel REST FullEnrich",
  activate_skill: "Activation d'une skill Flue",
};

const WORKFLOW_DESCRIPTIONS: Record<string, string> = {
  "prospect-scan": "Scan GTM : DNS, Sillage, enrichissement, ranking",
  "enrich-contacts": "Enrichissement batch de contacts",
  "sample-answer": "Démo orchestrateur + collecte",
};

/** Business description for a delegated sub-agent. */
export function agentDescription(agentName: string): string {
  return (
    AGENT_DESCRIPTIONS[agentName] ??
    `Sous-agent spécialisé · ${agentName.replaceAll("_", " ")}`
  );
}

/** Business description for a native tool (`defineTool`). */
export function toolDescription(toolName: string): string {
  return (
    TOOL_DESCRIPTIONS[toolName] ?? `Outil · ${toolName.replaceAll("_", " ")}`
  );
}

/** Business description for an MCP tool (`mcp__server__tool`). */
export function mcpToolDescription(toolName: string): string {
  const segments = toolName.split("__");
  if (segments.length < 3) {
    return "Appel MCP";
  }
  const server = segments[1] ?? "mcp";
  const tool = segments.at(-1) ?? toolName;
  const serverLabel = server.charAt(0).toUpperCase() + server.slice(1);
  return `Appel MCP ${serverLabel} · ${tool.replaceAll("_", " ")}`;
}

/** Subtitle for MCP tools: "Sillage · list_signals" instead of "mcp · sillage". */
export function mcpToolSubtitle(toolName: string): string {
  const segments = toolName.split("__");
  if (segments.length < 3) {
    return "mcp";
  }
  const server = segments[1] ?? "mcp";
  const tool = segments.at(-1) ?? toolName;
  const serverLabel = server.charAt(0).toUpperCase() + server.slice(1);
  return `${serverLabel} · ${tool}`;
}

/** Business description for a workflow run root node. */
export function workflowDescription(workflowName: string): string {
  return (
    WORKFLOW_DESCRIPTIONS[workflowName] ??
    `Exécution workflow · ${workflowName}`
  );
}
