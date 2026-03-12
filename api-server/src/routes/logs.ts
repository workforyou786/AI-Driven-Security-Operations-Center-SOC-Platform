import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { securityLogsTable, threatsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { SimulateAttackBody } from "@workspace/api-zod";

const router: IRouter = Router();

function randomIp() {
  return `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

router.get("/logs", async (req, res) => {
  const { type, limit } = req.query as Record<string, string>;
  const logs = type
    ? await db.select().from(securityLogsTable).where(eq(securityLogsTable.type, type)).orderBy(desc(securityLogsTable.timestamp)).limit(Number(limit) || 100)
    : await db.select().from(securityLogsTable).orderBy(desc(securityLogsTable.timestamp)).limit(Number(limit) || 100);

  res.json(
    logs.map((l) => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
    }))
  );
});

router.post("/logs/simulate", async (req, res) => {
  const body = SimulateAttackBody.parse(req.body);
  const sourceIp = randomIp();
  const target = body.targetHost ?? randomChoice(["web-server-01", "db-server-02", "auth-server-03", "api-gateway-01"]);
  const intensity = body.intensity ?? "medium";
  const logCount = intensity === "high" ? 15 : intensity === "medium" ? 8 : 3;

  const attackConfigs: Record<string, { logType: string; severity: string; messages: string[]; riskScore: number; mitreTactic: string; mitreId: string; logSeverity: string }> = {
    brute_force: {
      logType: "auth",
      severity: "high",
      logSeverity: "high",
      messages: [
        `Failed SSH login attempt from ${sourceIp} for user root`,
        `Multiple authentication failures from ${sourceIp}: 50 attempts in 60 seconds`,
        `Account lockout triggered for user admin - too many failures from ${sourceIp}`,
        `Brute force detected: ${sourceIp} attempting dictionary attack`,
      ],
      riskScore: 80,
      mitreTactic: "Credential Access",
      mitreId: "T1110",
    },
    sql_injection: {
      logType: "web",
      severity: "critical",
      logSeverity: "critical",
      messages: [
        `SQL injection attempt detected in request from ${sourceIp}: UNION SELECT * FROM users--`,
        `WAF blocked malicious query from ${sourceIp}: ' OR '1'='1`,
        `Database error triggered by suspicious input from ${sourceIp}`,
        `XSS/SQLi payload detected in HTTP request from ${sourceIp}`,
      ],
      riskScore: 95,
      mitreTactic: "Initial Access",
      mitreId: "T1190",
    },
    malware: {
      logType: "system",
      severity: "critical",
      logSeverity: "critical",
      messages: [
        `Suspicious process execution on ${target}: powershell.exe -EncodedCommand`,
        `Malware signature match: Trojan.GenericKD detected on ${target}`,
        `Unauthorized file modification in system32 on ${target}`,
        `C2 communication attempt detected from ${target} to ${sourceIp}`,
      ],
      riskScore: 99,
      mitreTactic: "Execution",
      mitreId: "T1059",
    },
    port_scan: {
      logType: "network",
      severity: "medium",
      logSeverity: "medium",
      messages: [
        `Nmap port scan detected from ${sourceIp}: scanning ${target} ports 1-65535`,
        `SYN scan activity from ${sourceIp} hitting multiple services`,
        `Port sweep detected: ${sourceIp} probing 100+ ports on ${target}`,
        `Service discovery scan from ${sourceIp}`,
      ],
      riskScore: 55,
      mitreTactic: "Discovery",
      mitreId: "T1046",
    },
    ddos: {
      logType: "network",
      severity: "critical",
      logSeverity: "critical",
      messages: [
        `DDoS attack detected: ${sourceIp} sending 50,000 req/s to ${target}`,
        `High traffic volume from ${sourceIp}: bandwidth saturation on ${target}`,
        `SYN flood attack from ${sourceIp} detected on port 80`,
        `Rate limit exceeded: ${sourceIp} blocked after 10,000 requests in 10s`,
      ],
      riskScore: 90,
      mitreTactic: "Impact",
      mitreId: "T1498",
    },
    phishing: {
      logType: "auth",
      severity: "high",
      logSeverity: "high",
      messages: [
        `Phishing email detected from spoofed domain: security@company-secure.net`,
        `User clicked suspicious link from ${sourceIp} — credential harvest attempt`,
        `Suspicious OAuth token request from ${sourceIp} for admin account`,
        `Email gateway blocked phishing campaign targeting finance department`,
      ],
      riskScore: 75,
      mitreTactic: "Initial Access",
      mitreId: "T1566",
    },
  };

  const config = attackConfigs[body.attackType];
  const logsToInsert = Array.from({ length: logCount }, (_, i) => ({
    type: config.logType as "auth" | "network" | "system" | "firewall" | "web",
    message: config.messages[i % config.messages.length],
    sourceIp,
    targetHost: target,
    severity: config.logSeverity,
    raw: `[${new Date().toISOString()}] ${config.logType.toUpperCase()} from=${sourceIp} target=${target} msg="${config.messages[i % config.messages.length]}"`,
    anomalyScore: Math.random() * 0.5 + 0.5,
    isAnomaly: true,
  }));

  await db.insert(securityLogsTable).values(logsToInsert);

  const [threat] = await db.insert(threatsTable).values({
    title: `${body.attackType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Attack Detected`,
    description: `Automated detection: ${config.messages[0]}`,
    severity: config.severity,
    type: body.attackType,
    status: "open",
    sourceIp,
    targetHost: target,
    riskScore: config.riskScore,
    mitreTactic: config.mitreTactic,
    mitreId: config.mitreId,
    rawLog: logsToInsert[0].raw,
  }).returning();

  res.json({
    success: true,
    logsGenerated: logCount,
    threatsDetected: 1,
    attackType: body.attackType,
    sourceIp,
    message: `Simulated ${body.attackType} attack from ${sourceIp} — ${logCount} logs generated, 1 threat created`,
  });
});

export default router;
