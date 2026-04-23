import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { teams } from "./teams";

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    source: text("source", {
      enum: ["sentry", "logs", "terminal", "slack", "support", "screenshot"],
    }).notNull(),
    title: text("title").notNull(),
    rawPayload: jsonb("raw_payload").notNull(),
    fileUrl: text("file_url"),
    fingerprint: text("fingerprint").notNull(),
    status: text("status", {
      enum: ["new", "processing", "converted", "dismissed"],
    })
      .notNull()
      .default("new"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("signals_team_status_idx").on(table.teamId, table.status),
    index("signals_team_fingerprint_idx").on(table.teamId, table.fingerprint),
  ]
);

export const signalsRelations = relations(signals, ({ one }) => ({
  team: one(teams, { fields: [signals.teamId], references: [teams.id] }),
}));
