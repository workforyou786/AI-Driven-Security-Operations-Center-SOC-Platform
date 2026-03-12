import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blockedIpsTable = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  reason: text("reason").notNull(),
  blockedAt: timestamp("blocked_at").notNull().defaultNow(),
  duration: text("duration").default("24h"),
  unblockedAt: timestamp("unblocked_at"),
  threatId: integer("threat_id"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBlockedIpSchema = createInsertSchema(blockedIpsTable).omit({ id: true });
export type InsertBlockedIp = z.infer<typeof insertBlockedIpSchema>;
export type BlockedIp = typeof blockedIpsTable.$inferSelect;
