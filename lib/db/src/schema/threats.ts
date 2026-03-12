import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const threatsTable = pgTable("threats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // critical, high, medium, low
  type: text("type").notNull(), // brute_force, sql_injection, malware, port_scan, etc.
  status: text("status").notNull().default("open"), // open, investigating, resolved, false_positive
  sourceIp: text("source_ip").notNull(),
  targetHost: text("target_host"),
  affectedUser: text("affected_user"),
  riskScore: integer("risk_score").notNull().default(50),
  mitreTactic: text("mitre_tactic"),
  mitreId: text("mitre_id"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  incidentId: integer("incident_id"),
  rawLog: text("raw_log"),
  notes: text("notes"),
});

export const insertThreatSchema = createInsertSchema(threatsTable).omit({ id: true });
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type Threat = typeof threatsTable.$inferSelect;
