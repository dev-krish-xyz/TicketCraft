import {
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { teams } from "./teams";
import { users } from "./auth";
import { signals } from "./signals";

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priority: text("priority", {
      enum: ["critical", "high", "medium", "minor"],
    }).notNull(),
    status: text("status", {
      enum: ["open", "in_progress", "resolved", "closed"],
    })
      .notNull()
      .default("open"),
    rootCause: text("root_cause"),
    aiConfidence: real("ai_confidence"),
    groupKey: text("group_key"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    assignedTo: uuid("assigned_to").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("tickets_team_status_idx").on(table.teamId, table.status),
    index("tickets_team_priority_idx").on(table.teamId, table.priority),
    index("tickets_team_group_idx").on(table.teamId, table.groupKey),
  ]
);

export const signalTickets = pgTable(
  "signal_tickets",
  {
    signalId: uuid("signal_id")
      .notNull()
      .references(() => signals.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.signalId, table.ticketId] })]
);

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  team: one(teams, { fields: [tickets.teamId], references: [teams.id] }),
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
  assignee: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
  signalTickets: many(signalTickets),
}));

export const signalTicketsRelations = relations(signalTickets, ({ one }) => ({
  signal: one(signals, {
    fields: [signalTickets.signalId],
    references: [signals.id],
  }),
  ticket: one(tickets, {
    fields: [signalTickets.ticketId],
    references: [tickets.id],
  }),
}));
