# DJ Frontend Integration Tasks

REST wiring
- GET /queue -> queue list state (filter by status)
- GET /history/accepted -> accepted history
- GET /history/rejected -> rejected history
- PATCH /queue/accept -> update queue item to accepted
- PATCH /queue/reject -> update queue item to rejected
- PATCH /queue/revert -> update queue item to pending (use returned item, no new id)
- POST /queue/insert -> add new queue item
- PATCH /queue/vote -> update votes where used
- Optional: GET /songs/genres, GET /songs/by-genre -> live catalog for insert modal

Socket listeners
- queue.request.created -> add pending item
- queue.vote.updated -> update votes
- dj.queue.inserted -> add item
- dj.queue.accepted -> update status to accepted
- dj.queue.rejected -> update status to rejected
- dj.queue.reverted -> update status to pending
- queue.item.updated -> fallback for any status updates

State update rules
- Use server responses as source of truth for accept/reject/revert
- Wait for server response before mutating VotesChart-driven actions

Constraints
- No UI changes
- No business logic redesign
