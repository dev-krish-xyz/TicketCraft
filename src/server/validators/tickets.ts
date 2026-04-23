import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(50000),
  priority: z.enum(["critical", "high", "medium", "minor"]),
  rootCause: z.string().max(5000).optional(),
  groupKey: z.string().max(200).optional(),
  assignedTo: z.string().uuid().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(50000).optional(),
  priority: z.enum(["critical", "high", "medium", "minor"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  rootCause: z.string().max(5000).optional(),
  groupKey: z.string().max(200).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export const generateTicketSchema = z.object({
  signalIds: z.array(z.string().uuid()).min(1).max(20),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type GenerateTicketInput = z.infer<typeof generateTicketSchema>;
