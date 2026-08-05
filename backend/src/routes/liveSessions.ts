import { Router } from "express";
import { authenticateOptional, requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { bumpRecord, type Actor } from "../utils/records.js";
import { nowIso } from "../utils/time.js";
import { emitVenueEvent } from "../socket/io.js";

const router = Router();
const sessionsPath = collectionPath("live_sessions.json");

const getActor = (req: any): Actor => ({
    actor_type: req.auth?.role ?? "system",
    actor_id: req.auth?.subjectId ?? null
});

const loadSessions = async () => readJson<{ schema_version: string; records: any[] }>(sessionsPath);

// List all sessions (admin only, filterable)
router.get("/live-sessions", requireAuth, authorize("djs.admin"), async (req, res) => {
    const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
    const djId = req.query.dj_id ? String(req.query.dj_id) : null;
    const status = req.query.status ? String(req.query.status) : null;

    const data = await loadSessions();
    let items = data.records.filter((s) => !s.deleted_at);
    if (venueId) items = items.filter((s) => s.venueId === venueId);
    if (djId) items = items.filter((s) => s.djId === djId);
    if (status) items = items.filter((s) => s.status === status);

    res.json({ items });
});

// Get active session for a venue (DJ or guest)
router.get("/live-sessions/active", authenticateOptional, async (req, res) => {
    const venueId = req.query.venue_id ? String(req.query.venue_id).trim() : null;
    if (!venueId) {
        return res.status(400).json({ error: "venue_id_required" });
    }

    const data = await loadSessions();
    const active = data.records.find(
        (s) => s.venueId === venueId && s.status === "active" && !s.deleted_at
    ) ?? null;

    res.json({ session: active });
});

// End a session (DJ or admin)
router.patch("/live-sessions/:id/end", requireAuth, authorize("dj.basic"), async (req, res) => {
    const actor = getActor(req);
    const data = await loadSessions();
    const index = data.records.findIndex((s) => s.id === req.params.id && !s.deleted_at);

    if (index === -1) {
        return res.status(404).json({ error: "session_not_found" });
    }

    const session = data.records[index];
    if (session.status === "ended") {
        return res.status(400).json({ error: "session_already_ended" });
    }

    const updated = bumpRecord({ ...session, status: "ended", endedAt: nowIso() }, actor);
    data.records[index] = updated;
    await writeJson(sessionsPath, data);

    // Notify venue listeners
    // Notify venue listeners
    emitVenueEvent("live_session.ended", session.venueId, {
        live_session: updated
    });

    res.json({ session: updated });
});

// Suspend a session (DJ logout — preserves data for later resume)
router.patch("/live-sessions/:id/suspend", requireAuth, authorize("dj.basic"), async (req, res) => {
    const actor = getActor(req);
    const data = await loadSessions();
    const index = data.records.findIndex((s) => s.id === req.params.id && !s.deleted_at);

    if (index === -1) {
        return res.status(404).json({ error: "session_not_found" });
    }

    const session = data.records[index];
    if (session.status === "ended") {
        return res.status(400).json({ error: "session_already_ended" });
    }
    if (session.status === "suspended") {
        return res.json({ session }); // Already suspended, idempotent
    }

    const updated = bumpRecord({ ...session, status: "suspended" }, actor);
    data.records[index] = updated;
    await writeJson(sessionsPath, data);

    emitVenueEvent("live_session.suspended", session.venueId, {
        live_session: updated
    });

    res.json({ session: updated });
});

export default router;
