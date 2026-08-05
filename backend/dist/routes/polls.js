import { Router } from "express";
import { requireAuth, authorize } from "../middleware/auth.js";
import { readJson, writeJson } from "../storage/jsonStore.js";
import { collectionPath } from "../storage/paths.js";
import { createRecordBase, bumpRecord } from "../utils/records.js";
import { nowIso } from "../utils/time.js";
import { appendAudit } from "../services/auditService.js";
import { emitVenueEvent } from "../socket/io.js";
import { createReadableId } from "../utils/ids.js";
const router = Router();
const pollsPath = collectionPath("polls.json");
const pollSongsPath = collectionPath("poll_songs.json");
const pollVotesPath = collectionPath("poll_votes.json");
const songsPath = collectionPath("songs.json");
const getActor = (req) => ({
    actor_type: req.auth?.role ?? "admin",
    actor_id: req.auth?.subjectId ?? null
});
const loadPolls = async () => readJson(pollsPath);
const loadPollSongs = async () => readJson(pollSongsPath);
const loadPollVotes = async () => readJson(pollVotesPath);
const loadSongs = async () => readJson(songsPath);
const requireVenueId = (value, res) => {
    const venueId = String(value ?? "");
    if (!venueId) {
        res.status(400).json({ error: "venue_id_required" });
        return null;
    }
    return venueId;
};
const ensureSongsInVenue = async (songIds, venueId) => {
    const songsData = await loadSongs();
    const songSet = new Set(songIds);
    const validSongs = songsData.records.filter((item) => songSet.has(item.id) && !item.deleted_at && item.venue_id === venueId);
    return validSongs.length === songIds.length;
};
const buildPollPayload = (poll, pollSongs, pollVotes) => {
    const songs = pollSongs.filter((item) => item.pollId === poll.id).map((item) => item.songId);
    const votes = pollVotes
        .filter((item) => item.pollId === poll.id)
        .reduce((acc, item) => {
        const key = String(item.songId ?? "");
        acc[key] = (acc[key] ?? 0) + Number(item.voteCount ?? 0);
        return acc;
    }, {});
    return { ...poll, songs, votes };
};
router.get("/polls", requireAuth, authorize("polls.admin"), async (req, res) => {
    const venueId = req.query.venue_id ? String(req.query.venue_id) : null;
    const liveSessionId = req.query.live_session_id ? String(req.query.live_session_id) : null;
    const data = await loadPolls();
    const pollSongsData = await loadPollSongs();
    const pollVotesData = await loadPollVotes();
    let items = data.records.filter((item) => !item.deleted_at && (venueId === null || item.venue_id === venueId));
    if (liveSessionId)
        items = items.filter((item) => item.live_session_id === liveSessionId);
    const result = items.map((poll) => buildPollPayload(poll, pollSongsData.records, pollVotesData.records));
    res.json({ items: result });
});
router.post("/polls", requireAuth, authorize("polls.admin"), async (req, res) => {
    const actor = getActor(req);
    const { title, songs, venue_id, live_session_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    if (!(await ensureSongsInVenue(songs ?? [], venueId))) {
        return res.status(400).json({ error: "songs_not_in_venue" });
    }
    const pollsData = await loadPolls();
    const pollSongsData = await loadPollSongs();
    const poll = {
        id: createReadableId("poll"),
        ...createRecordBase(actor),
        title,
        status: "open",
        totalVotes: 0,
        closedAt: null,
        venue_id: venueId,
        live_session_id: live_session_id ?? null
    };
    pollsData.records.push(poll);
    songs.forEach((songId) => {
        pollSongsData.records.push({
            id: `${createReadableId("poll_song")}_${songId}`,
            ...createRecordBase(actor),
            pollId: poll.id,
            songId
        });
    });
    await writeJson(pollsPath, pollsData);
    await writeJson(pollSongsPath, pollSongsData);
    await appendAudit({ entityType: "polls", entityId: poll.id, action: "create", before: null, after: poll, actor });
    emitVenueEvent("polls.updated", venueId, { pollIds: [poll.id], venueId, changeType: "create" });
    res.status(201).json(buildPollPayload(poll, pollSongsData.records, []));
});
router.patch("/polls/:id/close", requireAuth, authorize("polls.admin"), async (req, res) => {
    const actor = getActor(req);
    const data = await loadPolls();
    const venueId = requireVenueId(req.body.venue_id, res);
    if (!venueId)
        return;
    const index = data.records.findIndex((item) => item.id === req.params.id && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const before = data.records[index];
    const updated = bumpRecord({ ...before, status: "closed", closedAt: nowIso() }, actor);
    data.records[index] = updated;
    await writeJson(pollsPath, data);
    await appendAudit({ entityType: "polls", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("polls.updated", venueId, { pollIds: [updated.id], venueId, changeType: "close" });
    const pollSongsData = await loadPollSongs();
    const pollVotesData = await loadPollVotes();
    res.json(buildPollPayload(updated, pollSongsData.records, pollVotesData.records));
});
router.patch("/polls/:id/vote", requireAuth, authorize("polls.admin"), async (req, res) => {
    const actor = getActor(req);
    const { songId, voterId, venue_id } = req.body;
    const venueId = requireVenueId(venue_id, res);
    if (!venueId)
        return;
    const pollsData = await loadPolls();
    const pollVotesData = await loadPollVotes();
    const pollSongsData = await loadPollSongs();
    const index = pollsData.records.findIndex((item) => item.id === req.params.id && !item.deleted_at && item.venue_id === venueId);
    if (index === -1) {
        return res.status(404).json({ error: "not_found" });
    }
    const isSongInPoll = pollSongsData.records.some((item) => item.pollId === req.params.id && item.songId === songId && !item.deleted_at);
    if (!isSongInPoll) {
        return res.status(400).json({ error: "song_not_in_poll" });
    }
    const before = pollsData.records[index];
    const updated = bumpRecord({ ...before, totalVotes: before.totalVotes + 1 }, actor);
    pollsData.records[index] = updated;
    pollVotesData.records.push({
        id: createReadableId("poll_vote"),
        ...createRecordBase(actor),
        pollId: updated.id,
        songId,
        voterId: voterId ?? actor.actor_id,
        voteCount: 1
    });
    await writeJson(pollsPath, pollsData);
    await writeJson(pollVotesPath, pollVotesData);
    await appendAudit({ entityType: "polls", entityId: updated.id, action: "update", before, after: updated, actor });
    emitVenueEvent("polls.updated", venueId, { pollIds: [updated.id], venueId, changeType: "vote" });
    res.json(buildPollPayload(updated, pollSongsData.records, pollVotesData.records));
});
export default router;
