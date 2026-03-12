import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { threatsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateThreatBody,
  UpdateThreatStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/threats", async (req, res) => {
  const { severity, status, limit } = req.query as Record<string, string>;
  const conditions = [];
  if (severity) conditions.push(eq(threatsTable.severity, severity));
  if (status) conditions.push(eq(threatsTable.status, status));

  const threats = await db
    .select()
    .from(threatsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(threatsTable.detectedAt))
    .limit(Number(limit) || 50);

  res.json(
    threats.map((t) => ({
      ...t,
      detectedAt: t.detectedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() ?? undefined,
    }))
  );
});

router.post("/threats", async (req, res) => {
  const body = CreateThreatBody.parse(req.body);
  const mitreMap: Record<string, { tactic: string; id: string }> = {
    brute_force: { tactic: "Credential Access", id: "T1110" },
    sql_injection: { tactic: "Initial Access", id: "T1190" },
    malware: { tactic: "Execution", id: "T1059" },
    port_scan: { tactic: "Discovery", id: "T1046" },
    phishing: { tactic: "Initial Access", id: "T1566" },
    ddos: { tactic: "Impact", id: "T1498" },
    lateral_movement: { tactic: "Lateral Movement", id: "T1021" },
    data_exfiltration: { tactic: "Exfiltration", id: "T1041" },
    anomaly: { tactic: "Unknown", id: "T0000" },
  };
  const mitre = mitreMap[body.type] ?? { tactic: "Unknown", id: "T0000" };

  const [threat] = await db
    .insert(threatsTable)
    .values({
      ...body,
      riskScore: body.severity === "critical" ? 95 : body.severity === "high" ? 75 : body.severity === "medium" ? 50 : 25,
      mitreTactic: mitre.tactic,
      mitreId: mitre.id,
    })
    .returning();

  res.status(201).json({
    ...threat,
    detectedAt: threat.detectedAt.toISOString(),
    resolvedAt: threat.resolvedAt?.toISOString() ?? undefined,
  });
});

router.get("/threats/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [threat] = await db.select().from(threatsTable).where(eq(threatsTable.id, id));
  if (!threat) return res.status(404).json({ error: "Not found" });
  res.json({
    ...threat,
    detectedAt: threat.detectedAt.toISOString(),
    resolvedAt: threat.resolvedAt?.toISOString() ?? undefined,
  });
});

router.patch("/threats/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateThreatStatusBody.parse(req.body);

  const updates: Partial<typeof threatsTable.$inferInsert> = {
    status: body.status,
    notes: body.notes,
  };
  if (body.status === "resolved") {
    updates.resolvedAt = new Date();
  }

  const [threat] = await db
    .update(threatsTable)
    .set(updates)
    .where(eq(threatsTable.id, id))
    .returning();

  if (!threat) return res.status(404).json({ error: "Not found" });
  res.json({
    ...threat,
    detectedAt: threat.detectedAt.toISOString(),
    resolvedAt: threat.resolvedAt?.toISOString() ?? undefined,
  });
});

export default router;
