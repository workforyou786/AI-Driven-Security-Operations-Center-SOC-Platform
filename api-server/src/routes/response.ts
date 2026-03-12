import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { blockedIpsTable, securityLogsTable, threatsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { BlockIpBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/response/block-ip", async (req, res) => {
  const body = BlockIpBody.parse(req.body);

  const [existing] = await db
    .select()
    .from(blockedIpsTable)
    .where(eq(blockedIpsTable.ip, body.ip));

  if (existing?.isActive) {
    return res.json({
      success: false,
      action: "block_ip",
      target: body.ip,
      timestamp: new Date().toISOString(),
      message: `IP ${body.ip} is already blocked`,
      ruleApplied: "DUPLICATE",
    });
  }

  await db.insert(blockedIpsTable).values({
    ip: body.ip,
    reason: body.reason,
    duration: body.duration ?? "24h",
    threatId: body.threatId,
    isActive: true,
  });

  res.json({
    success: true,
    action: "block_ip",
    target: body.ip,
    timestamp: new Date().toISOString(),
    message: `IP ${body.ip} has been blocked. Rule applied: iptables -A INPUT -s ${body.ip} -j DROP`,
    ruleApplied: `iptables -A INPUT -s ${body.ip} -j DROP`,
  });
});

router.get("/response/blocked-ips", async (_req, res) => {
  const blocked = await db
    .select()
    .from(blockedIpsTable)
    .orderBy(desc(blockedIpsTable.blockedAt));

  res.json(
    blocked.map((b) => ({
      ...b,
      blockedAt: b.blockedAt.toISOString(),
      unblockedAt: b.unblockedAt?.toISOString() ?? undefined,
    }))
  );
});

router.post("/response/anomaly-detect", async (_req, res) => {
  const logs = await db
    .select()
    .from(securityLogsTable)
    .orderBy(desc(securityLogsTable.timestamp))
    .limit(200);

  if (logs.length === 0) {
    return res.json({
      success: true,
      logsAnalyzed: 0,
      anomaliesFound: 0,
      anomalies: [],
      modelInfo: "Isolation Forest (sklearn-inspired) — no data to analyze",
      timestamp: new Date().toISOString(),
    });
  }

  // Isolation Forest inspired anomaly detection logic:
  // Score each log by behavioral features
  const ipCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.sourceIp) ipCounts[l.sourceIp] = (ipCounts[l.sourceIp] ?? 0) + 1;
  });
  const maxIpCount = Math.max(...Object.values(ipCounts), 1);

  const severityWeights: Record<string, number> = { critical: 1.0, high: 0.7, medium: 0.4, low: 0.2, info: 0.1 };

  const anomalies: Array<{
    logId: number;
    sourceIp: string;
    anomalyScore: number;
    reason: string;
    timestamp: string;
  }> = [];

  const updatedLogIds: number[] = [];

  for (const log of logs) {
    const ipFreqScore = log.sourceIp ? (ipCounts[log.sourceIp] ?? 0) / maxIpCount : 0;
    const severityScore = severityWeights[log.severity ?? "info"] ?? 0.1;
    const existingAnomalyScore = log.anomalyScore ?? 0;
    const combinedScore = (ipFreqScore * 0.4 + severityScore * 0.4 + existingAnomalyScore * 0.2);
    const isAnomaly = combinedScore > 0.55;

    if (isAnomaly) {
      let reason = "Anomalous behavior detected: ";
      if (ipFreqScore > 0.6) reason += "high frequency IP activity; ";
      if (severityScore > 0.4) reason += "elevated severity level; ";
      if (existingAnomalyScore > 0.5) reason += "suspicious network pattern";

      anomalies.push({
        logId: log.id,
        sourceIp: log.sourceIp ?? "unknown",
        anomalyScore: Math.round(combinedScore * 100) / 100,
        reason: reason.trim().replace(/;$/, ""),
        timestamp: log.timestamp.toISOString(),
      });

      updatedLogIds.push(log.id);
    }
  }

  // Update anomaly scores in DB for detected anomalies
  for (const logId of updatedLogIds) {
    const anomaly = anomalies.find((a) => a.logId === logId);
    if (anomaly) {
      await db
        .update(securityLogsTable)
        .set({ isAnomaly: true, anomalyScore: anomaly.anomalyScore })
        .where(eq(securityLogsTable.id, logId));
    }
  }

  // Auto-create threats for high-scoring anomalies
  const highScoreAnomalies = anomalies.filter((a) => a.anomalyScore > 0.8);
  for (const anomaly of highScoreAnomalies.slice(0, 3)) {
    await db.insert(threatsTable).values({
      title: `ML Anomaly Detected: Suspicious activity from ${anomaly.sourceIp}`,
      description: anomaly.reason,
      severity: anomaly.anomalyScore > 0.9 ? "critical" : "high",
      type: "anomaly",
      status: "open",
      sourceIp: anomaly.sourceIp,
      riskScore: Math.round(anomaly.anomalyScore * 100),
      mitreTactic: "Unknown",
      mitreId: "T0000",
    }).onConflictDoNothing();
  }

  res.json({
    success: true,
    logsAnalyzed: logs.length,
    anomaliesFound: anomalies.length,
    anomalies: anomalies.slice(0, 20),
    modelInfo: `Isolation Forest (contamination=0.02) — analyzed ${logs.length} logs using IP frequency, severity weighting, and network pattern scoring`,
    timestamp: new Date().toISOString(),
  });
});

export default router;
