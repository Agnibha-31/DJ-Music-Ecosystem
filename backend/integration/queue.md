# Queue Frontend Integration Tasks

REST wiring
- GET /queue -> queue list state
- POST /queue/request -> add new pending queue item
- PATCH /queue/vote -> update votes
- Optional: GET /songs/genres, GET /songs/by-genre, GET /songs/search -> live catalog for search and request

Socket listeners
- queue.request.created -> add queue item
- queue.vote.updated -> update votes
- dj.queue.inserted -> add item
- dj.queue.accepted -> update status to accepted (optional remove from public list)
- dj.queue.rejected -> update status to rejected (optional remove)
- dj.queue.reverted -> update status to pending
- queue.item.updated -> fallback for any status change

State update rules
- Map Queue.status to UI filters; remove accepted/rejected if required by UI behavior

Constraints
- No UI changes
- No business logic redesign
