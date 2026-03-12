import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // critical, high, medium, low
  status: text("status").notNull().default("open"), // open, investigating, resolved, closed
  assignedTo: text("assigned_to"),
  affectedSystems: text("affected_systems"), // JSON array stored as text
  threatIds: text("threat_ids"), // JSON array stored as text
  timeline: text("timeline"), // JSON array stored as text
  responseActions: text("response_actions"), // JSON array stored as text
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
