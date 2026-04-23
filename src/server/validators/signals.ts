import { z } from "zod";

export const signalSourceEnum = z.enum([
  "sentry",
  "logs",
  "terminal",
  "slack",
  "support",
  "screenshot",
]);

export const createSignalSchema = z.object({
  source: signalSourceEnum,
  title: z.string().min(1).max(500),
  rawPayload: z.record(z.string(), z.unknown()),
  fileUrl: z.string().url().optional(),
});

export const ingestSignalSchema = z.object({
  source: signalSourceEnum,
  content: z.string().min(1).max(50000),
  title: z.string().min(1).max(500).optional(),
});

export const updateSignalSchema = z.object({
  status: z.enum(["new", "processing", "converted", "dismissed"]).optional(),
  title: z.string().min(1).max(500).optional(),
});

export type CreateSignalInput = z.infer<typeof createSignalSchema>;
export type IngestSignalInput = z.infer<typeof ingestSignalSchema>;
export type UpdateSignalInput = z.infer<typeof updateSignalSchema>;
