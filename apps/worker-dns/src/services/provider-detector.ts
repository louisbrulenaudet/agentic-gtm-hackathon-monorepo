import type { ConfidenceLevel, ProviderCategory } from "@repo/enums-common";

import type {
  FingerprintSource,
  ProviderFingerprint,
} from "./provider-fingerprints";
import { PROVIDER_FINGERPRINTS } from "./provider-fingerprints";

export interface DetectionInput {
  ns: string[];
  mxExchanges: string[];
  txt: string[];
  spfIncludes: string[];
}

export interface DetectedProvider {
  category: ProviderCategory;
  vendor: string;
  confidence: ConfidenceLevel;
  evidence: string[];
}

/**
 * Matches normalized DNS values against the fingerprint table and merges every
 * matching record into one detection per (category, vendor) pair, with one
 * evidence line per record that triggered it.
 */
export function detectProviders(input: DetectionInput): DetectedProvider[] {
  const detections = new Map<string, DetectedProvider>();

  for (const fingerprint of PROVIDER_FINGERPRINTS) {
    for (const value of valuesForSource(input, fingerprint.source)) {
      const matchedPattern = fingerprint.patterns.find((pattern) =>
        value.includes(pattern),
      );
      if (matchedPattern === undefined) {
        continue;
      }
      recordDetection(detections, fingerprint, value, matchedPattern);
    }
  }

  return [...detections.values()];
}

function valuesForSource(
  input: DetectionInput,
  source: FingerprintSource,
): string[] {
  switch (source) {
    case "ns":
      return input.ns;
    case "mxExchange":
      return input.mxExchanges;
    case "txt":
      return input.txt;
    case "spfInclude":
      return input.spfIncludes;
    default:
      return assertUnreachableSource(source);
  }
}

function sourceLabel(source: FingerprintSource): string {
  switch (source) {
    case "ns":
      return "NS record";
    case "mxExchange":
      return "MX record";
    case "txt":
      return "TXT record";
    case "spfInclude":
      return "SPF include";
    default:
      return assertUnreachableSource(source);
  }
}

function assertUnreachableSource(source: never): never {
  throw new Error(`Unhandled fingerprint source: ${String(source)}`);
}

function recordDetection(
  detections: Map<string, DetectedProvider>,
  fingerprint: ProviderFingerprint,
  value: string,
  pattern: string,
): void {
  const key = `${fingerprint.category}:${fingerprint.vendor}`;
  const evidence = `${sourceLabel(fingerprint.source)} "${value}" matched pattern "${pattern}"`;
  const existing = detections.get(key);

  if (existing === undefined) {
    detections.set(key, {
      category: fingerprint.category,
      vendor: fingerprint.vendor,
      confidence: fingerprint.confidence,
      evidence: [evidence],
    });
    return;
  }

  if (!existing.evidence.includes(evidence)) {
    existing.evidence.push(evidence);
  }
}
