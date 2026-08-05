import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
const router = Router();
const analyticsPath = collectionPath("analytics_snapshots.json");
router.get("/analytics", requireAuth, authorize("analytics.admin"), async (_req, res) => {
    const data = await readJson(analyticsPath);
    const latest = data.records.at(-1) ?? null;
    res.json({ analytics: latest });
});
router.get("/analytics/playback", requireAuth, authorize("analytics.admin"), async (_req, res) => {
    const data = await readJson(analyticsPath);
    const latest = data.records.at(-1) ?? null;
    res.json({ playback: latest?.playback ?? {} });
});
export default router;
