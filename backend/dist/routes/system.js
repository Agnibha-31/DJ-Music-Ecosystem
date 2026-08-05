import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { bumpRecord } from "../utils/records.js";
import { appendAudit } from "../services/auditService.js";
import { emitAdminEvent, emitToVenueRooms } from "../socket/io.js";
const router = Router();
const systemModePath = collectionPath("system_mode.json");
const systemConfigPath = collectionPath("system_config.json");
const settingsPath = collectionPath("settings.json");
const venuesPath = collectionPath("venues.json");
const getActor = (req) => ({
    actor_type: req.auth?.role ?? "admin",
    actor_id: req.auth?.subjectId ?? null
});
router.patch("/system-mode", requireAuth, authorize("system.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(systemModePath);
    const venuesData = await readJson(venuesPath);
    const before = data.record;
    const updated = bumpRecord({ ...before, ...req.body }, actor);
    data.record = updated;
    await writeJson(systemModePath, data);
    await appendAudit({ entityType: "system_mode", entityId: updated.id, action: "update", before, after: updated, actor });
    const payload = { systemMode: updated, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } };
    emitAdminEvent("admin.system_mode.updated", payload);
    emitToVenueRooms("system.mode.updated", venuesData.records.filter((item) => !item.deleted_at).map((item) => item.id), payload);
    res.json(updated);
});
router.get("/system-mode", async (_req, res) => {
    const data = await readJson(systemModePath);
    res.json({ systemMode: data.record });
});
router.get("/system-config", requireAuth, authorize("system.admin"), async (_req, res) => {
    const data = await readJson(systemConfigPath);
    res.json({ config: data.record });
});
router.patch("/system-config", requireAuth, authorize("system.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(systemConfigPath);
    const before = data.record;
    const updated = bumpRecord({ ...before, ...req.body }, actor);
    data.record = updated;
    await writeJson(systemConfigPath, data);
    await appendAudit({ entityType: "system_config", entityId: updated.id, action: "update", before, after: updated, actor });
    emitAdminEvent("admin.settings.updated", { systemConfig: updated, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.patch("/settings/wait-time", requireAuth, authorize("settings.wait_time.write"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(settingsPath);
    const before = data.record;
    const updated = bumpRecord({ ...before, waitTimeMinutes: req.body.waitTimeMinutes }, actor);
    data.record = updated;
    await writeJson(settingsPath, data);
    await appendAudit({ entityType: "settings", entityId: updated.id, action: "update", before, after: updated, actor });
    emitAdminEvent("admin.settings.updated", { settings: updated, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
export default router;
