import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  CreateIncidentBody,
  UpdateIncidentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatIncident(inc: typeof incidentsTable.$inferSelect) {
  return {
    ...inc,
    affectedSystems: inc.affectedSystems ? JSON.parse(inc.affectedSystems) : [],
    threatIds: inc.threatIds ? JSON.parse(inc.threatIds) : [],
    timeline: inc.timeline ? JSON.parse(inc.timeline) : [],
    responseActions: inc.responseActions ? JSON.parse(inc.responseActions) : [],
    createdAt: inc.createdAt.toISOString(),
    updatedAt: inc.updatedAt.toISOString(),
    resolvedAt: inc.resolvedAt?.toISOString() ?? undefined,
  };
}

router.get("/incidents", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const incidents = status
    ? await db.select().from(incidentsTable).where(eq(incidentsTable.status, status)).orderBy(desc(incidentsTable.createdAt))
    : await db.select().from(incidentsTable).orderBy(desc(incidentsTable.createdAt));
  res.json(incidents.map(formatIncident));
});

router.post("/incidents", async (req, res) => {
  const body = CreateIncidentBody.parse(req.body);
  const now = new Date();
  const [inc] = await db
    .insert(incidentsTable)
    .values({
      title: body.title,
      description: body.description,
      severity: body.severity,
      assignedTo: body.assignedTo,
      affectedSystems: JSON.stringify(body.affectedSystems ?? []),
      threatIds: JSON.stringify(body.threatIds ?? []),
      timeline: JSON.stringify([
        {
          timestamp: now.toISOString(),
          action: "Incident created",
          actor: body.assignedTo ?? "System",
        },
      ]),
      responseActions: JSON.stringify([]),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  res.status(201).json(formatIncident(inc));
});

router.get("/incidents/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [inc] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (!inc) return res.status(404).json({ error: "Not found" });
  res.json(formatIncident(inc));
});

router.patch("/incidents/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateIncidentBody.parse(req.body);
  const [existing] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const now = new Date();
  const timeline = existing.timeline ? JSON.parse(existing.timeline) : [];
  if (body.notes) {
    timeline.push({
      timestamp: now.toISOString(),
      action: body.notes,
      actor: body.assignedTo ?? existing.assignedTo ?? "Analyst",
    });
  }
  if (body.status && body.status !== existing.status) {
    timeline.push({
      timestamp: now.toISOString(),
      action: `Status changed to ${body.status}`,
      actor: body.assignedTo ?? existing.assignedTo ?? "Analyst",
    });
  }

  const existingActions = existing.responseActions ? JSON.parse(existing.responseActions) : [];
  const newActions = body.responseActions ?? [];
  const mergedActions = [...existingActions, ...newActions];

  const updates: Partial<typeof incidentsTable.$inferInsert> = {
    status: body.status ?? existing.status,
    assignedTo: body.assignedTo ?? existing.assignedTo,
    timeline: JSON.stringify(timeline),
    responseActions: JSON.stringify(mergedActions),
    updatedAt: now,
  };
  if (body.status === "resolved" || body.status === "closed") {
    updates.resolvedAt = now;
  }

  const [inc] = await db.update(incidentsTable).set(updates).where(eq(incidentsTable.id, id)).returning();
  res.json(formatIncident(inc));
});

export default router;
