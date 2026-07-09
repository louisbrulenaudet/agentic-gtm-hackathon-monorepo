import {
  ProspectReportSchema,
  type ProspectReport,
} from "@/dtos/prospect-report";

const reportContainers = ["report", "prospect", "result"] as const;

export function parseProspectReport(
  value: unknown,
): ProspectReport | undefined {
  const direct = ProspectReportSchema.safeParse(value);
  if (direct.success) {
    return direct.data;
  }

  if (!isObject(value)) {
    return undefined;
  }

  for (const key of reportContainers) {
    const nested = ProspectReportSchema.safeParse(value[key]);
    if (nested.success) {
      return nested.data;
    }
  }

  const prospects = value.prospects;
  if (Array.isArray(prospects)) {
    const first = ProspectReportSchema.safeParse(prospects[0]);
    if (first.success) {
      return first.data;
    }
  }

  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
