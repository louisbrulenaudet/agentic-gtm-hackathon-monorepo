import { z } from "zod";

/**
 * The Flue run UUID carried in the `/runs/$runId` route param. Flue owns the
 * exact format, so this stays permissive — a trimmed, non-empty, bounded string
 * — and is validated at the route boundary before streaming.
 */
export const RunIdSchema = z.string().trim().min(1).max(200);

export type RunId = z.infer<typeof RunIdSchema>;
