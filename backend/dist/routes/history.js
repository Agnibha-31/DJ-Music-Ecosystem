import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
const router = Router();
const queuePath = collectionPath("queue_items.json");
const requireVenueId = (value, res) => {
    const venueId = String(value ?? "");
    if (!venueId) {
        res.status(400).json({ error: "venue_id_required" });
        return null;
    }
    return venueId;
};
router.get("/history/accepted", requireAuth, authorize("history.read"), async (req, res) => {
    const venueId = requireVenueId(req.query.venue_id, res);
    if (!venueId)
        return;
    const liveSessionId = req.query.live_session_id ? String(req.query.live_session_id) : null;
    const data = await readJson(queuePath);
    let items = data.records.filter((item) => !item.deleted_at && item.status === "accepted" && item.venue_id === venueId);
    if (liveSessionId)
        items = items.filter((item) => item.live_session_id === liveSessionId);
    res.json({ items });
});
router.get("/history/rejected", requireAuth, authorize("history.read"), async (req, res) => {
    const venueId = requireVenueId(req.query.venue_id, res);
    if (!venueId)
        return;
    const liveSessionId = req.query.live_session_id ? String(req.query.live_session_id) : null;
    const data = await readJson(queuePath);
    let items = data.records.filter((item) => !item.deleted_at && item.status === "rejected" && item.venue_id === venueId);
    if (liveSessionId)
        items = items.filter((item) => item.live_session_id === liveSessionId);
    res.json({ items });
});
export default router;
