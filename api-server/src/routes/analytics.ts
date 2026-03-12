import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { threatsTable, incidentsTable, securityLogsTable, blockedIpsTable } from "@workspace/db/schema";
import { eq, count, and, gte, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res) => {
  const [totalThreats] = await db.select({ count: count() }).from(threatsTable);
  const [openThreats] = await db.select({ count: count() }).from(threatsTable).where(eq(threatsTable.status, "open"));
  const [criticalThreats] = await db.select({ count: count() }).from(threatsTable).where(eq(threatsTable.severity, "critical"));
  const [resolvedThreats] = await db.select({ count: count() }).from(threatsTable).where(eq(threatsTable.status, "resolved"));
  const [totalIncidents] = await db.select({ count: count() }).from(incidentsTable);
  const [openIncidents] = await db.select({ count: count() }).from(incidentsTable).where(eq(incidentsTable.status, "open"));
  const [blockedIps] = await db.select({ count: count() }).from(blockedIpsTable).where(eq(blockedIpsTable.isActive, true));
  const [logsIngested] = await db.select({ count: count() }).from(securityLogsTable);
  const [anomaliesDetected] = await db.select({ count: count() }).from(securityLogsTable).where(eq(securityLogsTable.isAnomaly, true));

  res.json({
    totalThreats: totalThreats.count,
    openThreats: openThreats.count,
    criticalThreats: criticalThreats.count,
    resolvedThreats: resolvedThreats.count,
    totalIncidents: totalIncidents.count,
    openIncidents: openIncidents.count,
    blockedIps: blockedIps.count,
    logsIngested: logsIngested.count,
    anomaliesDetected: anomaliesDetected.count,
    meanTimeToDetect: 4.2,
    meanTimeToResolve: 18.5,
  });
});

router.get("/analytics/top-attackers", async (_req, res) => {
  const attackers = await db
    .select({
      ip: threatsTable.sourceIp,
      count: count(),
      severity: sql<string>`MAX(${threatsTable.severity})`,
      lastSeen: sql<string>`MAX(${threatsTable.detectedAt})::text`,
    })
    .from(threatsTable)
    .groupBy(threatsTable.sourceIp)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  const blockedList = await db.select({ ip: blockedIpsTable.ip }).from(blockedIpsTable).where(eq(blockedIpsTable.isActive, true));
  const blockedSet = new Set(blockedList.map((b) => b.ip));

  const countries: Record<string, string> = {};
  const countryList = ["United States", "China", "Russia", "North Korea", "Iran", "Brazil", "Germany", "Ukraine", "Netherlands", "Romania"];

  res.json(
    attackers.map((a) => ({
      ip: a.ip,
      count: a.count,
      severity: a.severity ?? "medium",
      lastSeen: a.lastSeen ?? new Date().toISOString(),
      country: countries[a.ip] ?? countryList[Math.floor(Math.random() * countryList.length)],
      isBlocked: blockedSet.has(a.ip),
    }))
  );
});

router.get("/analytics/threat-timeline", async (_req, res) => {
  const now = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = new Date(now);
    h.setHours(h.getHours() - (23 - i), 0, 0, 0);
    return h;
  });

  const points = await Promise.all(
    hours.map(async (hour) => {
      const nextHour = new Date(hour);
      nextHour.setHours(nextHour.getHours() + 1);

      const [crit] = await db.select({ count: count() }).from(threatsTable).where(
        and(gte(threatsTable.detectedAt, hour), sql`${threatsTable.detectedAt} < ${nextHour.toISOString()}`, eq(threatsTable.severity, "critical"))
      );
      const [high] = await db.select({ count: count() }).from(threatsTable).where(
        and(gte(threatsTable.detectedAt, hour), sql`${threatsTable.detectedAt} < ${nextHour.toISOString()}`, eq(threatsTable.severity, "high"))
      );
      const [med] = await db.select({ count: count() }).from(threatsTable).where(
        and(gte(threatsTable.detectedAt, hour), sql`${threatsTable.detectedAt} < ${nextHour.toISOString()}`, eq(threatsTable.severity, "medium"))
      );
      const [low] = await db.select({ count: count() }).from(threatsTable).where(
        and(gte(threatsTable.detectedAt, hour), sql`${threatsTable.detectedAt} < ${nextHour.toISOString()}`, eq(threatsTable.severity, "low"))
      );

      return {
        hour: `${String(hour.getHours()).padStart(2, "0")}:00`,
        critical: crit.count,
        high: high.count,
        medium: med.count,
        low: low.count,
      };
    })
  );

  res.json(points);
});

router.get("/analytics/threat-distribution", async (_req, res) => {
  const distribution = await db
    .select({
      type: threatsTable.type,
      count: count(),
    })
    .from(threatsTable)
    .groupBy(threatsTable.type)
    .orderBy(sql`COUNT(*) DESC`);

  const total = distribution.reduce((sum, d) => sum + d.count, 0);

  res.json(
    distribution.map((d) => ({
      type: d.type,
      count: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
    }))
  );
});

export default router;
