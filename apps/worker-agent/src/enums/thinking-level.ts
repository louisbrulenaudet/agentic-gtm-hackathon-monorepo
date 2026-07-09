export const ThinkingLevel = {
  OFF: "off",
  MINIMAL: "minimal",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  XHIGH: "xhigh",
} as const;

export const THINKING_LEVELS = [
  ThinkingLevel.OFF,
  ThinkingLevel.MINIMAL,
  ThinkingLevel.LOW,
  ThinkingLevel.MEDIUM,
  ThinkingLevel.HIGH,
  ThinkingLevel.XHIGH,
] as const;

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
