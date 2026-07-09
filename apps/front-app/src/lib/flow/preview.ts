import type { FlowNodeField } from "@/dtos/flow-graph";
import { summarizeValue } from "./summarize";

const MAX_PREVIEW_FIELDS = 3;

function previewField(
  label: string,
  value: unknown,
): FlowNodeField | undefined {
  const summary = summarizeValue(value, 120);
  return summary ? { label, value: summary } : undefined;
}

function countArray(value: unknown): number | undefined {
  return Array.isArray(value) ? value.length : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Scout result: signal + decision-maker counts. */
function previewScoutResult(result: unknown): FlowNodeField[] {
  if (!isRecord(result)) {
    return [];
  }
  const fields: FlowNodeField[] = [];
  const signalCount = countArray(result.signals);
  const dmCount = countArray(result.decisionMakers);
  if (signalCount !== undefined) {
    fields.push({
      label: "signaux",
      value: `${signalCount} ${signalCount === 1 ? "signal" : "signaux"}`,
    });
  }
  if (dmCount !== undefined) {
    fields.push({
      label: "décideurs",
      value: `${dmCount} décideur${dmCount === 1 ? "" : "s"}`,
    });
  }
  if (typeof result.companyName === "string" && result.companyName.length > 0) {
    fields.push({ label: "entreprise", value: result.companyName });
  }
  return fields;
}

/** Enriched contact result. */
function previewEnrichResult(result: unknown): FlowNodeField[] {
  if (!isRecord(result)) {
    return [];
  }
  const fields: FlowNodeField[] = [];
  if (result.found === true) {
    const email =
      typeof result.email === "string" ? result.email : "trouvé sans email";
    fields.push({ label: "contact", value: email });
  } else if (result.found === false) {
    fields.push({ label: "contact", value: "non trouvé" });
  }
  if (typeof result.error === "string" && result.error.length > 0) {
    fields.push({ label: "erreur", value: summarizeValue(result.error, 120) });
  }
  return fields;
}

/** DNS fingerprint result. */
function previewFingerprintResult(result: unknown): FlowNodeField[] {
  if (!isRecord(result)) {
    return [];
  }
  const fields: FlowNodeField[] = [];
  if (typeof result.summary === "string" && result.summary.length > 0) {
    fields.push({ label: "stack", value: summarizeValue(result.summary, 120) });
  }
  if (typeof result.onCloudflare === "boolean") {
    fields.push({
      label: "cloudflare",
      value: result.onCloudflare ? "oui" : "non",
    });
  }
  return fields;
}

/** MCP tool result — often `{ content: [...] }`. */
function previewMcpResult(result: unknown): FlowNodeField[] {
  if (!isRecord(result)) {
    return [];
  }
  const content = result.content;
  if (Array.isArray(content)) {
    return [
      {
        label: "réponse",
        value: `${content.length} bloc${content.length === 1 ? "" : "s"} de contenu`,
      },
    ];
  }
  return [];
}

/** Pick smart preview lines based on agent/tool context. */
export function buildResultPreview(
  contextLabel: string,
  result: unknown,
): FlowNodeField[] {
  if (result === undefined || result === null) {
    return [];
  }

  let fields: FlowNodeField[] = [];
  if (contextLabel === "signal_scout") {
    fields = previewScoutResult(result);
  } else if (contextLabel === "contact_enricher") {
    fields = previewEnrichResult(result);
  } else if (contextLabel === "techstack_prober") {
    fields = previewFingerprintResult(result);
  } else if (contextLabel.startsWith("mcp__")) {
    fields = previewMcpResult(result);
  }

  if (fields.length === 0) {
    const fallback = previewField("résultat", result);
    return fallback ? [fallback] : [];
  }
  return fields.slice(0, MAX_PREVIEW_FIELDS);
}

/** Merge preview fields, deduplicating by label (last wins). */
export function mergePreviewFields(
  existing: FlowNodeField[],
  additions: FlowNodeField[],
): FlowNodeField[] {
  const byLabel = new Map(existing.map((entry) => [entry.label, entry]));
  for (const entry of additions) {
    byLabel.set(entry.label, entry);
  }
  return [...byLabel.values()].slice(0, MAX_PREVIEW_FIELDS);
}

/** Build a native tooltip string from description + preview fields. */
export function buildNodeTooltip(
  description: string | undefined,
  previewFields: FlowNodeField[],
): string | undefined {
  const lines: string[] = [];
  if (description) {
    lines.push(description);
  }
  for (const entry of previewFields) {
    lines.push(`${entry.label}: ${entry.value}`);
  }
  if (lines.length === 0) {
    return undefined;
  }
  lines.push("Cliquer pour voir le détail");
  return lines.join("\n");
}
