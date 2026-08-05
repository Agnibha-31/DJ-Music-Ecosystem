# Admin Frontend Integration Tasks

REST wiring
- GET /analytics -> dashboard analytics state
- GET /songs -> song catalog state
- GET /polls -> poll analytics state
- GET /queue -> control panel queue state
- GET /activity-logs -> dashboard + history logs state
- GET /users/activity -> user monitoring state
- GET /venues and GET /venue -> system config state
- GET /system-config and GET /system-mode -> system config + mode state
- PATCH /venue -> update venue state
- PATCH /system-mode -> update mode state
- PATCH /system-config and PATCH /settings/wait-time -> update config state
- POST /songs, PATCH /songs/:id, DELETE /songs/:id -> update song catalog state
- POST /songs/bulk -> bulk import results to song catalog state
- PATCH /songs/bulk-status -> update status for selected songs
- POST /polls and PATCH /polls/:id/close -> refresh or patch poll state
- PATCH /polls/:id/vote -> update poll vote counts
- POST /queue/insert -> add to queue
- POST /queue/request -> add to queue (public)
- PATCH /queue/:id/status -> update queue item
- PATCH /queue/:id/priority -> update priority
- POST /queue/force-play -> update queue item (requires queueItemId)
- DELETE /queue -> clear queue
- PATCH /songs/:id with { status: "blocked" } -> block song
- POST /activity-logs and DELETE /activity-logs/:id -> update activity log list
- PATCH /users/:id/flag-spam -> update user activity state

Socket listeners
- queue.request.created -> append queue item
- queue.vote.updated -> update queue item votes and charts
- dj.queue.accepted | dj.queue.rejected | dj.queue.reverted -> update queue item status
- admin.queue.priority.updated -> update queue item priority
- admin.queue.cleared -> clear queue state
- admin.system_mode.updated -> update system mode UI
- admin.settings.updated -> update wait time and config state
- admin.song.catalog.updated -> refresh or patch songs list
- polls.updated -> refresh or patch polls list
- activity_logs.updated -> append activity log list

State update rules
- Map Song.status: active -> enabled
- Map Poll.status: active -> open
- Map Queue.priority: normal/high/override -> 0/1/2
- Map Queue.status: forced -> playing
- Force play: insert first, then call /queue/force-play with returned queueItemId

Constraints
- No UI changes
- No business logic redesign
