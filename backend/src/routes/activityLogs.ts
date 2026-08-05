import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { createRecordBase, bumpRecord, type Actor } from "../utils/records.js";
import { appendAudit } from "../services/auditService.js";
import { emitAdminEvent } from "../socket/io.js";
import { createReadableId } from "../utils/ids.js";

const router = Router();
const logsPath = collectionPath("activity_logs.json");

const getActor = (req: any): Actor => ({
  actor_type: req.auth?.role ?? "admin",
  actor_id: req.auth?.subjectId ?? null
});

router.get("/activity-logs", requireAuth, authorize("activity_logs.admin"), async (_req, res) => {
  const data = await readJson<{ records: any[] }>(logsPath);
  res.json({ items: data.records.filter((item) => !item.deleted_at) });
});

router.post("/activity-logs", requireAuth, authorize("activity_logs.admin"), async (req, res) => {
  const actor = getActor(req);
  const { type, description, user, metadata } = req.body as Record<string, unknown>;
  const data = await readJson<{ records: any[] }>(logsPath);
  const record = {
    id: createReadableId("log"),
    ...createRecordBase(actor),
    type: String(type ?? "custom"),
    description: String(description ?? ""),
    timestamp: new Date().toISOString(),
    user: String(user ?? actor.actor_id ?? "system"),
    metadata: (metadata as Record<string, unknown>) ?? {}
  };
  data.records.push(record);
  await writeJson(logsPath, data);
  await appendAudit({ entityType: "activity_logs", entityId: record.id, action: "create", before: null, after: record, actor });
  emitAdminEvent("activity_logs.updated", { log: record, meta: { createdAt: record.created_at, actorId: actor.actor_id ?? null } });
  res.status(201).json(record);
});

router.delete("/activity-logs/:id", requireAuth, authorize("activity_logs.admin"), async (req, res) => {
  const actor = getActor(req);
  const data = await readJson<{ records: any[] }>(logsPath);
  const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
  if (index === -1) {
    return res.status(404).json({ error: "not_found" });
  }
  const before = data.records[index];
  const updated = bumpRecord({ ...before, deleted_at: new Date().toISOString() }, actor);
  data.records[index] = updated;
  await writeJson(logsPath, data);
  await appendAudit({ entityType: "activity_logs", entityId: updated.id, action: "delete", before, after: updated, actor });
  res.json({ ok: true });
});

export default router;
