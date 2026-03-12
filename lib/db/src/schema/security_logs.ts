import { pgTable, serial, text, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const securityLogsTable = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // auth, network, system, firewall, web
  message: text("message").notNull(),
  sourceIp: text("source_ip"),
  targetHost: text("target_host"),
  user: text("user"),
  severity: text("severity").notNull().default("info"), // critical, high, medium, low, info
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  raw: text("raw"),
  anomalyScore: real("anomaly_score"),
  isAnomaly: boolean("is_anomaly").default(false),
});

export const insertSecurityLogSchema = createInsertSchema(securityLogsTable).omit({ id: true });
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogsTable.$inferSelect;
