import { Router } from "express";
import { authenticateOptional, requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { bumpRecord } from "../utils/records.js";
import { appendAudit } from "../services/auditService.js";
const router = Router();
const usersPath = collectionPath("users.json");
const assetsPath = collectionPath("assets.json");
const getActor = (req) => ({
    actor_type: req.auth?.role ?? "admin",
    actor_id: req.auth?.subjectId ?? null
});
router.get("/users/activity", requireAuth, authorize("users.admin"), async (_req, res) => {
    const data = await readJson(usersPath);
    res.json({ items: data.records.filter((item) => !item.deleted_at) });
});
router.patch("/users/:id/flag-spam", requireAuth, authorize("users.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(usersPath);
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, flaggedForSpam: true }, actor);
    data.records[index] = updated;
    await writeJson(usersPath, data);
    await appendAudit({ entityType: "users", entityId: updated.id, action: "update", before, after: updated, actor });
    res.json(updated);
});
router.patch("/users/:id/unflag-spam", requireAuth, authorize("users.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(usersPath);
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, flaggedForSpam: false }, actor);
    data.records[index] = updated;
    await writeJson(usersPath, data);
    await appendAudit({ entityType: "users", entityId: updated.id, action: "update", before, after: updated, actor });
    res.json(updated);
});
router.get("/users/avatar", authenticateOptional, authorize("assets.read"), async (_req, res) => {
    const data = await readJson(assetsPath);
    const avatar = data.records.find((item) => item.type === "avatar") ?? null;
    res.json({ url: avatar?.url ?? null });
});
export default router;
