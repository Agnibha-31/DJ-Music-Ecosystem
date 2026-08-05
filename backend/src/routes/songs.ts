import { Router } from "express";
import { authenticateOptional, requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { createRecordBase, bumpRecord, type Actor } from "../utils/records.js";
import { appendAudit } from "../services/auditService.js";
import { emitVenueEvent } from "../socket/io.js";
import { env } from "../config/env.js";
import { getSongCatalog } from "../services/songCatalogService.js";
import { createReadableId } from "../utils/ids.js";

const router = Router();
const songsPath = collectionPath("songs.json");
const selectionsPath = collectionPath("venue_song_selections.json");

const getActor = (req: any): Actor => ({
  actor_type: req.auth?.role ?? "public",
  actor_id: req.auth?.subjectId ?? null
});

const loadSongs = async () => readJson<{ schema_version: string; records: any[] }>(songsPath);
const loadSelections = async () => readJson<{ records: any[] }>(selectionsPath, { records: [] });

type SelectedSong = { title: string; artist: string; genre?: string };

const songKey = (title: string, artist: string, genre: string) => `${title.trim().toLowerCase()}::${artist.trim().toLowerCase()}::${genre.trim().toLowerCase()}`;

const resolveSelectedSongs = async (selectedGenres: string[], selectedSongs: SelectedSong[]) => {
  const catalog = await getSongCatalog();
  const resolved: Array<{ title: string; artist: string; genre: string }> = [];

  const includeGenres = selectedSongs.length === 0;

  if (includeGenres) {
    selectedGenres.forEach((genre) => {
      const items = catalog[genre] ?? [];
      items.forEach((item) => {
        resolved.push({ title: item.title, artist: item.artist, genre });
      });
    });
  }

  selectedSongs.forEach((song) => {
    const genre = song.genre ?? "";
    if (!genre) {
      return;
    }
    resolved.push({ title: song.title, artist: song.artist, genre });
  });

  const deduped = new Map<string, { title: string; artist: string; genre: string }>();
  resolved.forEach((song) => {
    const key = songKey(song.title, song.artist, song.genre);
    if (!deduped.has(key)) {
      deduped.set(key, song);
    }
  });

  return Array.from(deduped.values());
};

// Helper to filter songs by venue
const filterByVenue = (records: any[], venueId: string | null) => {
  if (!venueId) return records;
  return records.filter((item) => item.venue_id === venueId);
};

// GET /songs/database - Get the centralized song database
router.get("/songs/database", requireAuth, authorize("songs.admin"), async (req, res) => {
  try {
    const database = await getSongCatalog();
    res.json(database);
  } catch (error) {
    console.error("Failed to load song database:", error);
    res.status(500).json({ error: "Failed to load song database" });
  }
});

// GET /songs/database/raw - Serve the raw catalog JSON (admin only)
router.get("/songs/database/raw", requireAuth, authorize("songs.admin"), async (_req, res) => {
  try {
    const database = await getSongCatalog();
    res.json(database);
  } catch (error) {
    console.error("Failed to load song database:", error);
    res.status(500).json({ error: "Failed to load song database" });
  }
});

// POST /songs/selection - Save venue song selection from the global catalog
router.post("/songs/selection", requireAuth, authorize("songs.admin"), async (req, res) => {
  const actor = getActor(req);
  const venueId = String(req.body.venue_id ?? "");
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }

  const selectedGenres = Array.isArray(req.body.selectedGenres)
    ? req.body.selectedGenres.map((genre: string) => String(genre)).filter(Boolean)
    : [];
  const selectedSongsInput = Array.isArray(req.body.selectedSongs) ? req.body.selectedSongs : [];
  const inferredGenre = selectedGenres.length === 1 ? selectedGenres[0] : "";
  const selectedSongs = selectedSongsInput.map((song: SelectedSong) => ({
    title: String(song.title ?? ""),
    artist: String(song.artist ?? ""),
    genre: song.genre ? String(song.genre) : inferredGenre
  })).filter((song: SelectedSong) => song.title && song.artist && song.genre);

  const selectionsData = await loadSelections();
  const existingSelection = selectionsData.records.find((record) => record.venueId === venueId);
  const existingGenres = Array.isArray(existingSelection?.selectedGenres) ? existingSelection.selectedGenres : [];
  const existingSongs = Array.isArray(existingSelection?.selectedSongs) ? existingSelection.selectedSongs : [];

  const combinedGenres = Array.from(new Set([...existingGenres, ...selectedGenres]));
  const combinedSongsInput = [...existingSongs, ...selectedSongs];
  const resolvedSongs = await resolveSelectedSongs([], combinedSongsInput as SelectedSong[]);

  const selectionPayload = {
    venueId,
    selectedGenres: combinedGenres,
    selectedSongs: resolvedSongs,
    lastUpdated: new Date().toISOString()
  };

  const selectionIndex = selectionsData.records.findIndex((record) => record.venueId === venueId);
  if (selectionIndex >= 0) {
    selectionsData.records[selectionIndex] = selectionPayload;
  } else {
    selectionsData.records.push(selectionPayload);
  }
  await writeJson(selectionsPath, selectionsData);

  const songsData = await loadSongs();
  const venueRecords = songsData.records.filter((item) => item.venue_id === venueId);
  const otherRecords = songsData.records.filter((item) => item.venue_id !== venueId);

  const venueByKey = new Map<string, any>();
  venueRecords.forEach((item) => {
    const key = songKey(String(item.title ?? ""), String(item.artist ?? ""), String(item.genre ?? ""));
    venueByKey.set(key, item);
  });

  const updatedVenueRecords: any[] = [...venueRecords];
  const updatedByKey = new Map<string, any>();
  updatedVenueRecords.forEach((item) => {
    const key = songKey(String(item.title ?? ""), String(item.artist ?? ""), String(item.genre ?? ""));
    updatedByKey.set(key, item);
  });

  resolvedSongs.forEach((song) => {
    const key = songKey(song.title, song.artist, song.genre);
    const existing = updatedByKey.get(key);
    if (existing) {
      const revived = bumpRecord({
        ...existing,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        status: "enabled",
        deleted_at: null
      }, actor);
      updatedByKey.set(key, revived);
      return;
    }
    const created = {
      id: createReadableId("song"),
      venue_id: venueId,
      ...createRecordBase(actor),
      title: song.title,
      artist: song.artist,
      album: "",
      duration: 0,
      genre: song.genre,
      language: "",
      explicit: false,
      addedDate: new Date().toISOString().slice(0, 10),
      status: "enabled",
      playCount: 0,
      voteCount: 0
    };
    updatedByKey.set(key, created);
  });

  songsData.records = [...otherRecords, ...Array.from(updatedByKey.values())];
  await writeJson(songsPath, songsData);

  await appendAudit({ entityType: "venue_song_selections", entityId: venueId, action: "update", before: null, after: selectionPayload, actor });
  env.logger.info({ venueId, selectedCount: resolvedSongs.length }, "Venue song selection updated");

  const updatedIds = updatedVenueRecords.filter((item) => !item.deleted_at && item.status === "enabled").map((item) => item.id);
  emitVenueEvent("venue.songs.updated", venueId, { venueId, songIds: updatedIds, changeType: "selection", meta: { updatedAt: selectionPayload.lastUpdated, actorId: actor.actor_id } });
  env.logger.info({ venueId, songCount: updatedIds.length }, "Venue song selection broadcast emitted");

  res.json({ ok: true, items: updatedIds });
});

// GET /songs - Admin list for a venue
router.get("/songs", requireAuth, authorize("songs.admin"), async (req, res) => {
  const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }
  const data = await loadSongs();
  const filtered = filterByVenue(
    data.records.filter((item) => !item.deleted_at),
    venueId
  );
  res.json({ items: filtered });
});

// GET /songs/catalog - Public catalog (must have venue_id, returns enabled songs only)
router.get("/songs/catalog", authenticateOptional, authorize("songs.catalog.read"), async (req, res) => {
  const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }
  const data = await loadSongs();
  const filtered = filterByVenue(
    data.records.filter((item) => !item.deleted_at && item.status === "enabled"),
    venueId
  );
  res.json({ items: filtered });
});

// GET /songs/genres - Get genres for a venue
router.get("/songs/genres", authenticateOptional, authorize("songs.catalog.read"), async (req, res) => {
  const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }
  const data = await loadSongs();
  const genres = Array.from(
    new Set(
      filterByVenue(
        data.records.filter((item) => !item.deleted_at),
        venueId
      ).map((item) => item.genre)
    )
  );
  res.json({ genres });
});

// GET /songs/by-genre - Get songs by genre for a venue
router.get("/songs/by-genre", authenticateOptional, authorize("songs.catalog.read"), async (req, res) => {
  const genre = String(req.query.genre ?? "");
  const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }
  const data = await loadSongs();
  const filtered = filterByVenue(
    data.records.filter((item) => !item.deleted_at && item.genre === genre),
    venueId
  );
  res.json({ items: filtered });
});

// GET /songs/search - Search songs in a venue
router.get("/songs/search", authenticateOptional, authorize("songs.catalog.read"), async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }
  const data = await loadSongs();
  const items = filterByVenue(
    data.records.filter((item) => !item.deleted_at && `${item.title} ${item.artist}`.toLowerCase().includes(q)),
    venueId
  );
  res.json({ items });
});

// POST /songs - Create a song in a venue
router.post("/songs", requireAuth, authorize("songs.admin"), async (req, res) => {
  const actor = getActor(req);
  const payload = req.body as Record<string, unknown>;
  const venueId = String(payload.venue_id ?? "");
  
  if (!venueId) {
    return res.status(400).json({ error: "venue_id is required" });
  }

  const data = await loadSongs();
  const record = {
    id: createReadableId("song"),
    venue_id: venueId,
    ...createRecordBase(actor),
    title: payload.title ?? "",
    artist: payload.artist ?? "",
    album: payload.album ?? "",
    duration: payload.duration ?? 0,
    genre: payload.genre ?? "",
    language: payload.language ?? "",
    explicit: payload.explicit ?? false,
    addedDate: payload.addedDate ?? new Date().toISOString().slice(0, 10),
    status: payload.status ?? "enabled",
    playCount: payload.playCount ?? 0,
    voteCount: payload.voteCount ?? 0
  };

  data.records.push(record);
  await writeJson(songsPath, data);
  await appendAudit({ entityType: "songs", entityId: record.id, action: "create", before: null, after: record, actor });
  env.logger.info({ venueId, songId: record.id, changeType: "create" }, "Venue songs updated");
  emitVenueEvent("venue.songs.updated", venueId, { venueId, songIds: [record.id], changeType: "create", meta: { updatedAt: record.updated_at, actorId: actor.actor_id } });
  res.status(201).json(record);
});

// POST /songs/bulk - Bulk import songs into a venue
router.post("/songs/bulk", requireAuth, authorize("songs.admin"), async (req, res) => {
  const actor = getActor(req);
  const { items, venue_id } = req.body as { items: Record<string, unknown>[]; venue_id: string };
  
  if (!venue_id) {
    return res.status(400).json({ error: "venue_id is required" });
  }

  const data = await loadSongs();
  const created: any[] = [];

  (items ?? []).forEach((payload) => {
    const record = {
      id: createReadableId("song"),
      venue_id: venue_id,
      ...createRecordBase(actor),
      title: payload.title ?? "",
      artist: payload.artist ?? "",
      album: payload.album ?? "",
      duration: payload.duration ?? 0,
      genre: payload.genre ?? "",
      language: payload.language ?? "",
      explicit: payload.explicit ?? false,
      addedDate: payload.addedDate ?? new Date().toISOString().slice(0, 10),
      status: payload.status ?? "enabled",
      playCount: payload.playCount ?? 0,
      voteCount: payload.voteCount ?? 0
    };

    data.records.push(record);
    created.push(record);
  });

  await writeJson(songsPath, data);
  await appendAudit({ entityType: "songs", entityId: "bulk", action: "create", before: null, after: created.map((item) => item.id), actor });
  if (created.length > 0) {
    env.logger.info({ venueId: venue_id, songCount: created.length, changeType: "bulk" }, "Venue songs updated");
    emitVenueEvent("venue.songs.updated", venue_id, { venueId: venue_id, songIds: created.map((item) => item.id), changeType: "bulk", meta: { updatedAt: new Date().toISOString(), actorId: actor.actor_id } });
  }
  res.status(201).json({ items: created });
});

// PATCH /songs/:id - Update a song (must be in same venue)
router.patch("/songs/:id", requireAuth, authorize("songs.admin"), async (req, res) => {
  const actor = getActor(req);
  const data = await loadSongs();
  const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
  if (index === -1) {
    return res.status(404).json({ error: "not_found" });
  }

  const before = data.records[index];
  const venueId = before.venue_id;
  
  // Prevent changing venue_id
  const payload = { ...req.body };
  delete payload.venue_id;
  
  const updated = bumpRecord({ ...before, ...payload }, actor);
  data.records[index] = updated;
  await writeJson(songsPath, data);
  await appendAudit({ entityType: "songs", entityId: updated.id, action: "update", before, after: updated, actor });
  env.logger.info({ venueId, songId: updated.id, changeType: "update" }, "Venue songs updated");
  emitVenueEvent("venue.songs.updated", venueId, { venueId, songIds: [updated.id], changeType: "update", meta: { updatedAt: updated.updated_at, actorId: actor.actor_id } });
  res.json(updated);
});

// DELETE /songs/:id - Delete a song
router.delete("/songs/:id", requireAuth, authorize("songs.admin"), async (req, res) => {
  const actor = getActor(req);
  const data = await loadSongs();
  const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at);
  if (index === -1) {
    return res.status(404).json({ error: "not_found" });
  }

  const before = data.records[index];
  const venueId = before.venue_id;
  
  const updated = bumpRecord({ ...before, deleted_at: new Date().toISOString(), status: "disabled" }, actor);
  data.records[index] = updated;
  await writeJson(songsPath, data);
  await appendAudit({ entityType: "songs", entityId: updated.id, action: "delete", before, after: updated, actor });
  env.logger.info({ venueId, songId: updated.id, changeType: "delete" }, "Venue songs updated");
  emitVenueEvent("venue.songs.updated", venueId, { venueId, songIds: [updated.id], changeType: "delete", meta: { updatedAt: updated.updated_at, actorId: actor.actor_id } });
  res.json({ ok: true });
});

// PATCH /songs/bulk-status - Bulk update song status in a venue
router.patch("/songs/bulk-status", requireAuth, authorize("songs.admin"), async (req, res) => {
  const actor = getActor(req);
  const { ids, status, venue_id } = req.body as { ids: string[]; status: string; venue_id: string };
  
  if (!venue_id) {
    return res.status(400).json({ error: "venue_id is required" });
  }

  const data = await loadSongs();
  const updatedIds: string[] = [];

  data.records = data.records.map((item) => {
    if (!item.deleted_at && item.venue_id === venue_id && ids.includes(item.id)) {
      updatedIds.push(item.id);
      return bumpRecord({ ...item, status }, actor);
    }
    return item;
  });

  await writeJson(songsPath, data);
  await appendAudit({ entityType: "songs", entityId: "bulk", action: "update", before: ids, after: status, actor });
  env.logger.info({ venueId: venue_id, songCount: updatedIds.length, changeType: "bulk_status" }, "Venue songs updated");
  emitVenueEvent("venue.songs.updated", venue_id, { venueId: venue_id, songIds: updatedIds, changeType: "bulk", meta: { updatedAt: new Date().toISOString(), actorId: actor.actor_id } });
  res.json({ updated: updatedIds.length });
});

export default router;
