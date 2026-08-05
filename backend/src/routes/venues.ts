import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { createRecordBase, bumpRecord, type Actor } from "../utils/records.js";
import { appendAudit } from "../services/auditService.js";
import { emitVenueEvent } from "../socket/io.js";
import { createReadableId } from "../utils/ids.js";

const router = Router();
const venuesPath = collectionPath("venues.json");
const settingsPath = collectionPath("settings.json");

const getActor = (req: any): Actor => ({
  actor_type: req.auth?.role ?? "admin",
  actor_id: req.auth?.subjectId ?? null
});

const loadVenues = async () => readJson<{ records: any[] }>(venuesPath);
const loadSettings = async () => readJson<{ record: any }>(settingsPath);

const resolveActiveVenue = async () => {
  const venuesData = await loadVenues();
  const settingsData = await loadSettings();
  const activeVenueId = settingsData.record?.activeVenueId ?? null;
  const activeVenue = venuesData.records.find((item) => !item.deleted_at && item.id === activeVenueId)
    ?? venuesData.records.find((item) => !item.deleted_at)
    ?? null;

  return { venuesData, settingsData, activeVenue, activeVenueId: activeVenue?.id ?? null };
};

router.get("/venue", async (_req, res) => {
  const { settingsData, activeVenue, activeVenueId } = await resolveActiveVenue();
  if (!settingsData.record?.activeVenueId && activeVenueId) {
    settingsData.record = { ...settingsData.record, activeVenueId };
    await writeJson(settingsPath, settingsData);
  }
  res.json({ venue: activeVenue, activeVenueId });
});

router.get("/venues/public/:id", async (req, res) => {
  const venueId = String(req.params.id ?? "").trim();
  if (!venueId) {
    return res.status(400).json({ error: "venue_id_required" });
  }

  const venuesData = await loadVenues();
  const venue = venuesData.records.find((item) => item.id === venueId && !item.deleted_at) ?? null;
  if (!venue) {
    return res.status(404).json({ error: "venue_not_found" });
  }

  res.json({ venue });
});

router.patch("/venue/active", requireAuth, authorize("venues.admin"), async (req, res) => {
  const actor = getActor(req);
  const venueId = String(req.body.venueId ?? "");
  if (!venueId) {
    return res.status(400).json({ error: "venue_id_required" });
  }

  const venuesData = await loadVenues();
  const venue = venuesData.records.find((item) => item.id === venueId && !item.deleted_at);
  if (!venue) {
    return res.status(404).json({ error: "venue_not_found" });
  }

  const settingsData = await loadSettings();
  const before = settingsData.record;
  const updated = bumpRecord({ ...before, activeVenueId: venueId }, actor);
  settingsData.record = updated;
  await writeJson(settingsPath, settingsData);

  await appendAudit({ entityType: "settings", entityId: updated.id, action: "update", before, after: updated, actor });
  emitVenueEvent("venue.active.updated", venueId, { venue, venueId, meta: { updatedAt: updated.updated_at, actorId: actor.actor_id } });
  res.json({ venue, activeVenueId: venueId });
});

router.patch("/venue", requireAuth, authorize("venues.admin"), async (req, res) => {
  const actor = getActor(req);
  const { venuesData, activeVenueId } = await resolveActiveVenue();
  const index = venuesData.records.findIndex((item) => !item.deleted_at && item.id === activeVenueId);
  if (index === -1) {
    return res.status(404).json({ error: "not_found" });
  }

  const before = venuesData.records[index];
  const updated = bumpRecord({ ...before, ...req.body }, actor);
  venuesData.records[index] = updated;
  await writeJson(venuesPath, venuesData);
  await appendAudit({ entityType: "venues", entityId: updated.id, action: "update", before, after: updated, actor });
  emitVenueEvent("venue.updated", updated.id, { venue: updated, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
  res.json(updated);
});

router.patch("/venues/:id", requireAuth, authorize("venues.admin"), async (req, res) => {
  const actor = getActor(req);
  const data = await loadVenues();
  const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
  if (index === -1) {
    return res.status(404).json({ error: "not_found" });
  }

  const before = data.records[index];
  const updated = bumpRecord({ ...before, ...req.body }, actor);
  data.records[index] = updated;
  await writeJson(venuesPath, data);
  await appendAudit({ entityType: "venues", entityId: updated.id, action: "update", before, after: updated, actor });
  emitVenueEvent("venue.updated", updated.id, { venue: updated, meta: { version: updated.record_version, updatedAt: updated.updated_at, actorId: actor.actor_id } });
  res.json(updated);
});

router.get("/venues", requireAuth, authorize("venues.admin"), async (_req, res) => {
  const data = await loadVenues();
  res.json({ items: data.records.filter((item) => !item.deleted_at) });
});

router.post("/venues", requireAuth, authorize("venues.admin"), async (req, res) => {
  const actor = getActor(req);
  const data = await loadVenues();
  const record = {
    id: createReadableId("venue"),
    ...createRecordBase(actor),
    name: req.body.name ?? "",
    logo: req.body.logo ?? "",
    accentColor: req.body.accentColor ?? "",
    address: req.body.address ?? "",
    city: req.body.city ?? "",
    state: req.body.state ?? "",
    zipCode: req.body.zipCode ?? "",
    phone: req.body.phone ?? "",
    email: req.body.email ?? ""
  };
  data.records.push(record);
  await writeJson(venuesPath, data);
  await appendAudit({ entityType: "venues", entityId: record.id, action: "create", before: null, after: record, actor });
  emitVenueEvent("venue.created", record.id, { venue: record, meta: { version: record.record_version, createdAt: record.created_at, actorId: actor.actor_id } });
  res.status(201).json(record);
});

router.delete("/venues/:id", requireAuth, authorize("venues.admin"), async (req, res) => {
  const actor = getActor(req);
  const data = await loadVenues();
  const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
  if (index === -1) {
    return res.status(404).json({ error: "not_found" });
  }
  const before = data.records[index];
  const updated = bumpRecord({ ...before, deleted_at: new Date().toISOString() }, actor);
  data.records[index] = updated;
  await writeJson(venuesPath, data);
  await appendAudit({ entityType: "venues", entityId: updated.id, action: "delete", before, after: updated, actor });
  emitVenueEvent("venue.deleted", req.params.id, { venueId: req.params.id, meta: { version: updated.record_version, deletedAt: updated.deleted_at, actorId: actor.actor_id } });
  const settingsData = await loadSettings();
  if (settingsData.record?.activeVenueId === req.params.id) {
    const fallback = data.records.find((item) => !item.deleted_at) ?? null;
    const updatedSettings = bumpRecord({ ...settingsData.record, activeVenueId: fallback?.id ?? null }, actor);
    settingsData.record = updatedSettings;
    await writeJson(settingsPath, settingsData);
    if (fallback) {
      emitVenueEvent("venue.active.updated", fallback.id, { venue: fallback, venueId: fallback.id, meta: { updatedAt: updatedSettings.updated_at, actorId: actor.actor_id } });
    }
  }
  res.json({ ok: true });
});

export default router;
