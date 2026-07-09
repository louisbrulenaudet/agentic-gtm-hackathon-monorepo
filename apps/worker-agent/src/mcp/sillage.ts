import { connectMcpServer, type ToolDefinition } from "@flue/runtime";
import { env } from "cloudflare:workers";

/**
 * Sillage MCP client.
 *
 * Connects the Worker to Sillage's hosted MCP server over Streamable HTTP and
 * adapts its listed tools into ordinary Flue tools (named `mcp__sillage__…`).
 * This is the Flue-native realization of the Cloudflare "MCP client" feature:
 * `connectMcpServer` wraps the MCP SDK's `StreamableHTTPClientTransport`.
 *
 * Auth. The Sillage MCP endpoint validates a static `Authorization: Bearer`
 * token — an anonymous or bad token gets `401 {"error":"Invalid or expired API
 * key"}`, so a _valid_ bearer is all it wants. We bind `SILLAGE_API_KEY` in
 * code and send it as a header; no interactive OAuth flow, which a headless
 * Worker could not complete anyway. The key is authority held by the tool,
 * never a model-supplied argument (see `.claude/rules/guardrails.md`).
 */
const SILLAGE_MCP_URL = "https://api.getsillage.com/api/mcp/v2";
const SILLAGE_MCP_SERVER_NAME = "sillage";

/**
 * Read-only Sillage capabilities exposed to the model. Least privilege: the
 * Sillage MCP also ships write tools (edit persona, add accounts, launch runs),
 * and model-facing surfaces must stay read/query-oriented (guardrails), so we
 * **allow-list** rather than deny — anything not named here is never surfaced.
 *
 * These are base capability names. Adapted tool names are
 * `mcp__sillage__<orig>` and Sillage may prefix the original with
 * `sillage_v2_`, so we match on the tail (`…_list_signals`) instead of an exact
 * string.
 */
const SILLAGE_READONLY_TOOLS = ["list_signals"] as const;

function isReadOnlySillageTool(toolName: string): boolean {
  return SILLAGE_READONLY_TOOLS.some(
    (base) => toolName === base || toolName.endsWith(`_${base}`),
  );
}

/**
 * Connect to Sillage and return only the allow-listed read-only tools, ready to
 * drop into an agent's `tools`. Returns `[]` (and logs) when the key is unset
 * or the connection fails, so this optional integration degrades the agent
 * gracefully instead of breaking construction.
 */
export async function connectSillageReadTools(): Promise<ToolDefinition[]> {
  const apiKey = env.SILLAGE_API_KEY;
  if (!apiKey) {
    console.warn(
      "[sillage-mcp] SILLAGE_API_KEY unset — skipping Sillage MCP tools.",
    );
    return [];
  }

  try {
    const connection = await connectMcpServer(SILLAGE_MCP_SERVER_NAME, {
      url: SILLAGE_MCP_URL,
      transport: "streamable-http",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const readOnly = connection.tools.filter((tool) =>
      isReadOnlySillageTool(tool.name),
    );

    if (readOnly.length === 0) {
      const exposed = connection.tools.map((tool) => tool.name).join(", ");
      console.warn(
        `[sillage-mcp] Connected, but no allow-listed read tool matched. Server exposed: ${exposed}`,
      );
    }

    return readOnly;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[sillage-mcp] Failed to connect to Sillage MCP: ${reason}`);
    return [];
  }
}
