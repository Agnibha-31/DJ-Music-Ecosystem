# Backend Integration Plan

Backend changes required
- Add GET /system-mode to return { systemMode }
- Emit activity_logs.updated when activity logs are appended
- Add POST /songs/bulk to support admin bulk import

Endpoints to keep unchanged
- All existing /queue, /songs, /polls, /analytics, /activity-logs, /users, /venues, /history, /system-config, /settings/wait-time, /auth

Conflicts resolved and canonical contract
- Song.status: enabled | disabled | blocked (map UI active -> enabled)
- Poll.status: open | closed (map UI active -> open)
- Queue.status: pending | accepted | rejected | playing | played (map UI forced -> playing)
- Queue.priority: number (normal=0, high=1, override=2)
- Force play uses queueItemId (UI must insert first)
