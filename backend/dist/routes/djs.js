import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { createRecordBase, bumpRecord } from "../utils/records.js";
import { nowIso } from "../utils/time.js";
import { appendAudit } from "../services/auditService.js";
import { emitAdminEvent, emitDjAccessEvent, emitVenueEvent } from "../socket/io.js";
import { createReadableId } from "../utils/ids.js";
const router = Router();
const djsPath = collectionPath("djs.json");
const accessRequestsPath = collectionPath("dj_access_requests.json");
const venuesPath = collectionPath("venues.json");
const sessionsPath = collectionPath("live_sessions.json");
const getActor = (req) => ({
    actor_type: req.auth?.role ?? "admin",
    actor_id: req.auth?.subjectId ?? null
});
router.get("/djs", requireAuth, authorize("djs.admin"), async (_req, res) => {
    const data = await readJson(djsPath);
    res.json({ items: (data.records ?? []).filter((item) => !item.deleted_at) });
});
router.get("/djs/:id", requireAuth, authorize("djs.admin"), async (req, res) => {
    const data = await readJson(djsPath);
    const record = data.records.find((item) => item.id === req.params.id && !item.deleted_at) ?? null;
    res.json({ dj: record });
});
router.get("/djs/me/venue", requireAuth, authorize("dj.basic"), async (req, res) => {
    const djId = req.auth?.subjectId ?? null;
    if (!djId) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const djsData = await readJson(djsPath);
    const dj = djsData.records.find((item) => item.id === djId && !item.deleted_at);
    if (!dj) {
        return res.status(404).json({ error: "dj_not_found" });
    }
    if (!dj.authenticated) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const venueId = String(dj.venueId ?? "").trim();
    if (!venueId) {
        return res.status(404).json({ error: "venue_not_assigned" });
    }
    const venuesData = await readJson(venuesPath);
    const venue = venuesData.records.find((item) => item.id === venueId && !item.deleted_at) ?? null;
    if (!venue) {
        return res.status(404).json({ error: "venue_not_found" });
    }
    // Look up the active live session for this DJ at this venue
    const sessionsData = await readJson(sessionsPath);
    const activeSession = sessionsData.records.find((s) => s.djId === djId && s.venueId === venueId && s.status === "active" && !s.deleted_at) ?? null;
    res.json({ venueId, venue, liveSessionId: activeSession?.id ?? null });
});
router.post("/djs", requireAuth, authorize("djs.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(djsPath);
    const record = {
        id: createReadableId("dj"),
        ...createRecordBase(actor),
        name: req.body.name ?? "",
        username: req.body.username ?? "",
        phone: req.body.phone ?? "",
        email: req.body.email ?? "",
        bio: req.body.bio ?? "",
        authKey: req.body.authKey ?? createReadableId("auth"),
        authenticated: false
    };
    data.records.push(record);
    await writeJson(djsPath, data);
    await appendAudit({ entityType: "djs", entityId: record.id, action: "create", before: null, after: record, actor });
    res.status(201).json(record);
});
router.patch("/djs/:id/auth-key", requireAuth, authorize("djs.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(djsPath);
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, authKey: req.body.authKey ?? createReadableId("auth") }, actor);
    data.records[index] = updated;
    await writeJson(djsPath, data);
    await appendAudit({ entityType: "djs", entityId: updated.id, action: "update", before, after: updated, actor });
    res.json(updated);
});
router.patch("/djs/:id/authenticate", requireAuth, authorize("djs.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(djsPath);
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const nextAuthKey = typeof req.body?.authKey === "string" && req.body.authKey.trim()
        ? req.body.authKey.trim()
        : before.authKey;
    const updated = bumpRecord({ ...before, authKey: nextAuthKey, authenticated: true }, actor);
    data.records[index] = updated;
    await writeJson(djsPath, data);
    await appendAudit({ entityType: "djs", entityId: updated.id, action: "update", before, after: updated, actor });
    res.json(updated);
});
router.delete("/djs/:id", requireAuth, authorize("djs.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await readJson(djsPath);
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, deleted_at: new Date().toISOString() }, actor);
    data.records[index] = updated;
    await writeJson(djsPath, data);
    await appendAudit({ entityType: "djs", entityId: updated.id, action: "delete", before, after: updated, actor });
    // Emit socket event to force logout the deleted DJ
    emitAdminEvent("dj.account.deleted", {
        djId: updated.id,
        djUsername: updated.username,
        meta: {
            version: updated.version,
            updatedAt: updated.updated_at,
            actorId: actor.actor_id
        }
    });
    res.json({ ok: true });
});
// DJ Access Request Routes (Public for DJ login)
router.post("/dj-access-request", async (req, res) => {
    try {
        const { username, authKey } = req.body;
        if (!username || !authKey) {
            return res.status(400).json({ error: "username and authKey required" });
        }
        // Verify DJ exists and authKey matches
        const djsData = await readJson(djsPath);
        const dj = djsData.records.find((d) => d.username === username && d.authKey === authKey && !d.deleted_at);
        if (!dj) {
            return res.status(401).json({ error: "invalid_credentials" });
        }
        // Guard: reject if DJ already has an active session at any venue
        const sessionsData = await readJson(sessionsPath);
        const activeSession = sessionsData.records.find((s) => s.djId === dj.id && s.status === "active" && !s.deleted_at);
        if (activeSession) {
            return res.status(409).json({
                error: "dj_has_active_session",
                message: "DJ already has an active session. Please logout from the current venue first.",
                activeVenueId: activeSession.venueId
            });
        }
        // Check if there's already a pending request
        const requestsData = await readJson(accessRequestsPath);
        const existingPending = requestsData.records.find((r) => r.djId === dj.id && r.status === "pending" && !r.deleted_at);
        if (existingPending) {
            return res.json({ request: existingPending, message: "request_already_pending" });
        }
        // Create new access request
        const actor = { actor_type: "dj", actor_id: dj.id };
        const request = {
            id: createReadableId("djreq"),
            ...createRecordBase(actor),
            djId: dj.id,
            djName: dj.name,
            djUsername: dj.username,
            status: "pending",
            requestedAt: new Date().toISOString()
        };
        requestsData.records.push(request);
        await writeJson(accessRequestsPath, requestsData);
        // Emit socket event to notify admin
        emitAdminEvent("dj.access.requested", { request });
        res.status(201).json({ request, message: "request_submitted" });
    }
    catch (error) {
        console.error("DJ access request failed:", error);
        res.status(500).json({ error: "internal_error" });
    }
});
// Get all access requests (Admin only)
router.get("/dj-access-requests", requireAuth, authorize("djs.admin"), async (_req, res) => {
    const data = await readJson(accessRequestsPath);
    const requests = data.records.filter((r) => !r.deleted_at);
    res.json({ items: requests });
});
// Approve DJ access request (Admin only)
router.patch("/dj-access-requests/:id/approve", requireAuth, authorize("djs.admin"), async (req, res) => {
    try {
        const actor = getActor(req);
        const venueId = String(req.body?.venueId ?? req.body?.venue_id ?? "").trim();
        if (!venueId) {
            return res.status(400).json({ error: "venue_id_required" });
        }
        const venuesData = await readJson(venuesPath);
        const venue = venuesData.records.find((v) => v.id === venueId && !v.deleted_at);
        if (!venue) {
            return res.status(404).json({ error: "venue_not_found" });
        }
        const requestsData = await readJson(accessRequestsPath);
        const requestIndex = requestsData.records.findIndex((r) => r.id === req.params.id && !r.deleted_at);
        if (requestIndex === -1) {
            return res.status(404).json({ error: "not_found" });
        }
        const request = requestsData.records[requestIndex];
        if (request.status !== "pending") {
            return res.status(400).json({ error: "request_already_processed" });
        }
        // Check for active session by ANOTHER DJ
        const sessionsData = await readJson(sessionsPath);
        const activeSession = sessionsData.records.find((s) => s.venueId === venueId && s.status === "active" && !s.deleted_at);
        const djsData = await readJson(djsPath);
        if (activeSession && activeSession.djId !== request.djId) {
            const activeDj = djsData.records.find((d) => d.id === activeSession.djId);
            const activeDjName = activeDj?.name || "Unknown DJ";
            return res.status(409).json({ error: "venue_occupied", activeDjName });
        }
        // Update request status
        const updatedRequest = bumpRecord({ ...request, status: "approved", approvedAt: new Date().toISOString(), venueId }, actor);
        requestsData.records[requestIndex] = updatedRequest;
        await writeJson(accessRequestsPath, requestsData);
        // Also update DJ authenticated status
        const djIndex = djsData.records.findIndex((d) => d.id === request.djId && !d.deleted_at);
        const actor2 = getActor(req);
        // Check for a suspended session for this DJ at this venue (resume it)
        const suspendedIndex = sessionsData.records.findIndex((s) => s.djId === request.djId && s.venueId === venueId && s.status === "suspended" && !s.deleted_at);
        let sessionToUse;
        if (suspendedIndex !== -1) {
            // Reactivate the suspended session
            const suspended = sessionsData.records[suspendedIndex];
            sessionToUse = bumpRecord({ ...suspended, status: "active" }, actor2);
            sessionsData.records[suspendedIndex] = sessionToUse;
        }
        else {
            // Create brand new session
            sessionToUse = {
                id: createReadableId("session"),
                ...createRecordBase(actor2),
                djId: request.djId,
                venueId,
                status: "active",
                startedAt: nowIso(),
                endedAt: null
            };
            sessionsData.records.push(sessionToUse);
        }
        await writeJson(sessionsPath, sessionsData);
        if (djIndex !== -1) {
            const before = djsData.records[djIndex];
            const updatedDj = bumpRecord({ ...before, authenticated: true, venueId, liveSessionId: sessionToUse.id }, actor);
            djsData.records[djIndex] = updatedDj;
            await writeJson(djsPath, djsData);
            await appendAudit({ entityType: "djs", entityId: updatedDj.id, action: "update", before, after: updatedDj, actor });
        }
        // Emit socket events
        emitDjAccessEvent("dj.access.approved", updatedRequest.id, { requestId: updatedRequest.id, djId: request.djId });
        emitVenueEvent("dj.access.approved", updatedRequest.venueId ?? null, { requestId: updatedRequest.id, djId: request.djId });
        emitVenueEvent("live_session.started", venueId, { live_session: sessionToUse });
        res.json({ request: updatedRequest, message: "access_granted" });
    }
    catch (error) {
        console.error("Approve access request failed:", error);
        res.status(500).json({ error: "internal_error" });
    }
});
// Deny DJ access request (Admin only)
router.patch("/dj-access-requests/:id/deny", requireAuth, authorize("djs.admin"), async (req, res) => {
    try {
        const actor = getActor(req);
        const requestsData = await readJson(accessRequestsPath);
        const requestIndex = requestsData.records.findIndex((r) => r.id === req.params.id && !r.deleted_at);
        if (requestIndex === -1) {
            return res.status(404).json({ error: "not_found" });
        }
        const request = requestsData.records[requestIndex];
        if (request.status !== "pending") {
            return res.status(400).json({ error: "request_already_processed" });
        }
        // Update request status
        const updatedRequest = bumpRecord({ ...request, status: "denied", deniedAt: new Date().toISOString() }, actor);
        requestsData.records[requestIndex] = updatedRequest;
        await writeJson(accessRequestsPath, requestsData);
        // Emit socket event to notify pending DJ login by request id
        emitDjAccessEvent("dj.access.denied", updatedRequest.id, { requestId: updatedRequest.id, djId: request.djId });
        emitAdminEvent("dj.access.denied", { requestId: updatedRequest.id, djId: request.djId });
        res.json({ request: updatedRequest, message: "access_denied" });
    }
    catch (error) {
        console.error("Deny access request failed:", error);
        res.status(500).json({ error: "internal_error" });
    }
});
export default router;
