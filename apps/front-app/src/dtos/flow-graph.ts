import type { Edge, Node } from "@xyflow/react";
import { FlowNodeKind } from "@enums/flow-node-kind";
import { FlowNodeStatus } from "@enums/flow-node-status";
import { z } from "zod";

/**
 * View models for the run-execution graph rendered with React Flow.
 *
 * These are UI-only (built from the Flue event stream by `lib/flow`), so they
 * live app-local rather than in `@repo/dtos-common`. They are validated and
 * kept JSON-serializable (no functions/instances) so node `data` round-trips
 * safely, per the React Flow node-data contract.
 */

/** One key/value carried from a Flue event onto a node (args, result, model…). */
export const FlowNodeFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
});

/** Unified node `data`. `kind` selects the presentational component + styling. */
export const FlowNodeDataSchema = z.object({
  kind: z.enum(FlowNodeKind),
  label: z.string(),
  status: z.enum(FlowNodeStatus),
  /** Secondary line under the label (tool name, agent profile, workflow name). */
  subtitle: z.string().optional(),
  /** Wall-clock duration in ms once the step settled. */
  durationMs: z.number().optional(),
  /** Pre-summarized context/params from the triggering event. */
  fields: z.array(FlowNodeFieldSchema).default([]),
});

/** Edge `data`; `active` drives the animated dashes while the target runs. */
export const FlowEdgeDataSchema = z.object({
  active: z.boolean().default(false),
});

export type FlowNodeField = z.infer<typeof FlowNodeFieldSchema>;
export type FlowNodeData = z.infer<typeof FlowNodeDataSchema>;
export type FlowEdgeData = z.infer<typeof FlowEdgeDataSchema>;

/** React Flow node/edge aliases bound to our data shapes. */
export type AppNode = Node<FlowNodeData>;
export type AppEdge = Edge<FlowEdgeData>;
