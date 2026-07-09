/** JSON formatting for the node detail panel. Pure — no React. */

/** Pretty-print a detail section value for display in a `<pre>`. */
export function formatDetailValue(value: unknown): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    return "[unserializable]";
  }
}
