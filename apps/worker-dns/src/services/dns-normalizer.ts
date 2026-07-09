import type { DohAnswer } from "./dns-client";

export interface MxRecord {
  exchange: string;
  priority: number;
}

export interface SpfInfo {
  raw: string | null;
  includes: string[];
}

export function normalizeNsRecords(answers: DohAnswer[]): string[] {
  return dedupe(
    answers.map((answer) => stripTrailingDot(answer.data.toLowerCase())),
  );
}

export function normalizeMxRecords(answers: DohAnswer[]): MxRecord[] {
  return answers
    .map((answer) => parseMxData(answer.data))
    .filter((record): record is MxRecord => record !== null);
}

export function normalizeTxtRecords(answers: DohAnswer[]): string[] {
  return dedupe(answers.map((answer) => unquoteTxtData(answer.data)));
}

/**
 * SPF is a single TXT record starting with `v=spf1`; `include:` mechanisms
 * inside it name the third-party senders/marketing tools authorized to send as
 * this domain.
 */
export function extractSpfInfo(txtRecords: string[]): SpfInfo {
  const raw = txtRecords.find((record) => /^v=spf1/i.test(record)) ?? null;
  if (raw === null) {
    return { raw: null, includes: [] };
  }

  const includes = dedupe(
    [...raw.matchAll(/include:(\S+)/gi)]
      .map((match) => match[1])
      .filter((value): value is string => value !== undefined),
  );

  return { raw, includes };
}

function parseMxData(data: string): MxRecord | null {
  const parts = data.trim().split(/\s+/);
  const priorityText = parts[0];
  const exchange = parts[1];
  if (priorityText === undefined || exchange === undefined) {
    return null;
  }

  const priority = Number(priorityText);
  if (Number.isNaN(priority)) {
    return null;
  }

  return { exchange: stripTrailingDot(exchange.toLowerCase()), priority };
}

function unquoteTxtData(data: string): string {
  return data.replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"');
}

function stripTrailingDot(value: string): string {
  return value.endsWith(".") ? value.slice(0, -1) : value;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
