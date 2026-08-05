import { Router } from "express";
import { authenticateOptional, requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson, updateJsonAtomically } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { createRecordBase, bumpRecord } from "../utils/records.js";
import { nowIso } from "../utils/time.js";
import { appendAudit } from "../services/auditService.js";
import { appendActivityLog } from "../services/activityLogService.js";
import { emitVenueEvent } from "../socket/io.js";
import { createReadableId } from "../utils/ids.js";
const router = Router();
const queuePath = collectionPath("queue_items.json");
const songsPath = collectionPath("songs.json");
const getActor = (req) => ({
    actor_type: req.auth?.role ?? "public",
    actor_id: req.auth?.subjectId ?? null
});
const loadQueue = async () => readJson(queuePath);
const loadSongs = async () => readJson(songsPath);
const requireVenueId = (value, res) => {
    const venueId = String(value ?? "");
    if (!venueId) {
        res.status(400).json({ error: "venue_id_required" });
        return null;
    }
    return venueId;
};
const ensureSongInVenue = async (songId, venueId) => {
    if (!songId)
        return true;
    const songsData = await loadSongs();
    const song = songsData.records.find((item) => item.id === songId && !item.deleted_at);
    return Boolean(song && song.venue_id === venueId);
};
router.get("/queue", authenticateOptional, authorize("queue.read"), async (req, res) => {
    const venueId = requireVenueId(req.query.venue_id, res);
    if (!venueId)
        return;
    const liveSessionId = req.query.live_session_id ? String(req.query.live_session_id) : null;
    const data = await loadQueue();
    let items = data.records.filter((item) => !item.deleted_at && item.venue_id === venueId);
    if (liveSessionId)
        items = items.filter((item) => item.live_session_id === liveSessionId);
    res.json({ items });
});
router.get("/queue/all", requireAuth, authorize("queue.admin"), async (_req, res) => {
    const data = await loadQueue();
    res.json({ items: data.records.filter((item) => !item.deleted_at) });
});
router.post("/queue/request", authenticateOptional, authorize("queue.request"), async (req, res) => {
    const actor = getActor(req);
    const { songId, songTitle, artist, genre, venue_id, live_session_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    if (!songId) {
        return res.status(400).json({ error: "song_id_required" });
    }
    if (!(await ensureSongInVenue(songId, venueId))) {
        return res.status(400).json({ error: "song_not_in_venue" });
    }
    const data = await loadQueue();
    const record = {
        id: createReadableId("queue"),
        ...createRecordBase(actor),
        songId,
        songTitle,
        artist,
        genre,
        votes: 0,
        requestedBy: actor.actor_id ?? "anonymous",
        timestamp: nowIso(),
        status: "pending",
        priority: 0,
        venue_id: venueId,
        live_session_id: live_session_id ?? null
    };
    data.records.push(record);
    await writeJson(queuePath, data);
    await appendActivityLog({
        type: "queue.request",
        description: `Request: ${songTitle}`,
        user: actor.actor_id ?? "anonymous",
        actor,
        metadata: { queueItemId: record.id }
    });
    await appendAudit({
        entityType: "queue_items",
        entityId: record.id,
        action: "create",
        before: null,
        after: record,
        actor
    });
    emitVenueEvent("queue.request.created", venueId, { queueItem: record, venueId, meta: { version: record.record_version, createdAt: record.created_at } });
    res.status(201).json(record);
});
router.post("/queue/insert", requireAuth, authorize("queue.insert"), async (req, res) => {
    const actor = getActor(req);
    const { songId, songTitle, artist, genre, venue_id, live_session_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    if (!(await ensureSongInVenue(songId, venueId))) {
        return res.status(400).json({ error: "song_not_in_venue" });
    }
    const data = await loadQueue();
    const record = {
        id: createReadableId("queue"),
        ...createRecordBase(actor),
        songId: songId ?? null,
        songTitle,
        artist,
        genre,
        votes: 0,
        requestedBy: actor.actor_id ?? "dj",
        timestamp: nowIso(),
        status: "pending",
        priority: 0,
        venue_id: venueId,
        live_session_id: live_session_id ?? null
    };
    data.records.push(record);
    await writeJson(queuePath, data);
    await appendAudit({
        entityType: "queue_items",
        entityId: record.id,
        action: "create",
        before: null,
        after: record,
        actor
    });
    emitVenueEvent("dj.queue.inserted", venueId, { queueItem: record, venueId, meta: { version: record.record_version, createdAt: record.created_at, actorId: actor.actor_id } });
    res.status(201).json(record);
});
router.patch("/queue/vote", authenticateOptional, authorize("queue.vote"), async (req, res) => {
    const actor = getActor(req);
    const { queueItemId, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const { before, updated } = await updateJsonAtomically(queuePath, async (data) => {
        const index = data.records.findIndex((item) => item.id === queueItemId && !item.deleted_at && item.venue_id === venueId);
        if (index === -1) {
            return { next: data, result: { before: null, updated: null } };
        }
        const currentBefore = data.records[index];
        const currentUpdated = bumpRecord({ ...currentBefore, votes: currentBefore.votes + 1 }, actor);
        data.records[index] = currentUpdated;
        return { next: data, result: { before: currentBefore, updated: currentUpdated } };
    });
    if (!updated || !before) {
        return res.status(404).json({ error: "not_found" });
    }
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("queue.vote.updated", venueId, { queueItemId: updated.id, votes: updated.votes, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.patch("/queue/accept", requireAuth, authorize("queue.accept"), async (req, res) => {
    const actor = getActor(req);
    const { queueItemId, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === queueItemId && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, status: "accepted" }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendActivityLog({ type: "queue.accept", description: `Accepted: ${before.songTitle}`, user: actor.actor_id ?? "dj", actor, metadata: { queueItemId } });
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("dj.queue.accepted", venueId, { queueItemId: updated.id, status: updated.status, queueItem: updated, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.patch("/queue/reject", requireAuth, authorize("queue.reject"), async (req, res) => {
    const actor = getActor(req);
    const { queueItemId, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === queueItemId && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, status: "rejected" }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendActivityLog({ type: "queue.reject", description: `Rejected: ${before.songTitle}`, user: actor.actor_id ?? "dj", actor, metadata: { queueItemId } });
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("dj.queue.rejected", venueId, { queueItemId: updated.id, status: updated.status, queueItem: updated, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.patch("/queue/revert", requireAuth, authorize("queue.revert"), async (req, res) => {
    const actor = getActor(req);
    const { queueItemId, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === queueItemId && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, status: "pending" }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("dj.queue.reverted", venueId, { queueItemId: updated.id, status: updated.status, queueItem: updated, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.delete("/queue/:id", authenticateOptional, authorize("queue.delete"), async (req, res) => {
    const actor = getActor(req);
    const venueId = requireVenueId(req.query.venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, deleted_at: nowIso() }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "delete", before, after: updated, actor });
    res.json({ ok: true });
});
router.patch("/queue/:id/status", requireAuth, authorize("queue.admin"), async (req, res) => {
    const actor = getActor(req);
    const { status, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, status }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("queue.item.updated", venueId, { queueItemId: updated.id, status: updated.status, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at } });
    res.json(updated);
});
router.patch("/queue/:id/priority", requireAuth, authorize("queue.admin"), async (req, res) => {
    const actor = getActor(req);
    const { priority, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, priority }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("admin.queue.priority.updated", venueId, { queueItemId: updated.id, priority: updated.priority, status: updated.status, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.post("/queue/force-play", requireAuth, authorize("queue.admin"), async (req, res) => {
    const actor = getActor(req);
    const { queueItemId, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    const index = data.records.findIndex((item) => item.id === queueItemId && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, status: "playing", priority: before.priority + 1 }, actor);
    data.records[index] = updated;
    await writeJson(queuePath, data);
    await appendAudit({ entityType: "queue_items", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("admin.queue.priority.updated", venueId, { queueItemId: updated.id, priority: updated.priority, status: updated.status, venueId, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
    res.json(updated);
});
router.delete("/queue", requireAuth, authorize("queue.admin"), async (req, res) => {
    const actor = getActor(req);
    const venueId = requireVenueId(req.query.venue_id ?? req.body?.venue_id, res);
    if (!venueId)
        return;
    const data = await loadQueue();
    data.records = data.records.filter((item) => item.venue_id !== venueId);
    await writeJson(queuePath, data);
    await appendAudit({ entityType: "queue_items", entityId: "*", action: "delete", before: null, after: null, actor, reason: "clear_queue" });
    emitVenueEvent("admin.queue.cleared", venueId, { reason: "clear_queue", venueId, meta: { updatedAt: nowIso(), actorId: actor.actor_id } });
    res.json({ ok: true });
});
export default router;
