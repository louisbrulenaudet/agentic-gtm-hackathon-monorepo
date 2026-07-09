/**
 * Display helpers for turning arbitrary Flue event payloads into short,
 * single-line strings safe to render on a node. Pure, no React.
 */

const DEFAULT_MAX_LENGTH = 80;

/** Stringify + collapse whitespace + truncate any value for node display. */
export function summarizeValue(
  value: unknown,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  if (value === undefined || value === null) {
    return "";
  }

  let text: string;
  if (typeof value === "string") {
    text = value;
  } else {
    try {
      text = JSON.stringify(value) ?? "";
    } catch {
      // Circular / non-serializable (BigInt, etc.) — avoid Object's default
      // `[object Object]` stringification.
      text = "[unserializable]";
    }
  }

  text = text.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * MCP tools are named `mcp__<server>__<tool>`. Show only the tool segment as
 * the label; native (`defineTool`) tools are shown verbatim.
 */
export function prettyToolName(toolName: string): string {
  if (!toolName.startsWith("mcp__")) {
    return toolName;
  }
  const segments = toolName.split("__");
  return segments.at(-1) ?? toolName;
}

/** The `mcp · <server>` subtitle for an MCP tool, or `undefined` if not MCP. */
export function mcpServerName(toolName: string): string | undefined {
  if (!toolName.startsWith("mcp__")) {
    return undefined;
  }
  const segments = toolName.split("__");
  return segments.length >= 3 ? `mcp · ${segments[1]}` : "mcp";
}

/** Format a duration in ms as a compact human string (e.g. `1.2s`, `840ms`). */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }
  return `${(durationMs / 1000).toFixed(1)}s`;
}
