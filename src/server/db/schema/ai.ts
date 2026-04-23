import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { signals } from "./signals";
import { tickets } from "./tickets";

export const aiAnalyses = pgTable("ai_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  signalId: uuid("signal_id")
    .notNull()
    .references(() => signals.id, { onDelete: "cascade" }),
  ticketId: uuid("ticket_id").references(() => tickets.id, {
    onDelete: "set null",
  }),
  provider: text("provider", { enum: ["gemini", "groq", "ollama"] }).notNull(),
  model: text("model").notNull(),
  promptHash: text("prompt_hash").notNull(),
  response: jsonb("response").notNull(),
  tokensUsed: integer("tokens_used"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  signal: one(signals, {
    fields: [aiAnalyses.signalId],
    references: [signals.id],
  }),
  ticket: one(tickets, {
    fields: [aiAnalyses.ticketId],
    references: [tickets.id],
  }),
}));
