# Canonical REST Contract

Base
- Content-Type: application/json
- Auth: Bearer access token unless noted

Authentication
- POST /auth/admin/login
  - Request: { username, password }
  - Response: { accessToken, refreshToken }
- POST /auth/dj/login
  - Request: { username, authKey }
  - Response: { accessToken, refreshToken }
- POST /auth/guest
  - Request: none
  - Response: { accessToken, refreshToken }
- POST /auth/refresh
  - Request: { refreshToken }
  - Response: { accessToken, refreshToken }
- POST /auth/logout
  - Request: { jti }
  - Response: { ok: true }

Admin data bootstrap
- GET /analytics
  - Auth: admin
  - Response: { analytics: AnalyticsSnapshot | null }
- GET /songs
  - Auth: admin
  - Response: { items: Song[] }
- GET /polls
  - Auth: admin
  - Response: { items: Poll[] }
- GET /queue
  - Auth: optional
  - Response: { items: QueueItem[] }
- GET /activity-logs
  - Auth: admin
  - Response: { items: ActivityLog[] }
- GET /users/activity
  - Auth: admin
  - Response: { items: UserActivity[] }
- GET /venues
  - Auth: admin
  - Response: { items: Venue[] }
- GET /venue
  - Auth: admin
  - Response: { venue: Venue | null }
- GET /system-config
  - Auth: admin
  - Response: { config: SystemConfig }
- GET /system-mode
  - Auth: admin
  - Response: { systemMode: SystemMode }

Songs (admin)
- POST /songs
  - Auth: admin
  - Request: SongCreate
  - Response: Song
- PATCH /songs/:id
  - Auth: admin
  - Request: Partial<Song>
  - Response: Song
- DELETE /songs/:id
  - Auth: admin
  - Response: { ok: true }
- PATCH /songs/bulk-status
  - Auth: admin
  - Request: { ids: string[], status: SongStatus }
  - Response: { updated: number }
- POST /songs/bulk
  - Auth: admin
  - Request: { items: SongCreate[] }
  - Response: { items: Song[] }

Songs (public catalog)
- GET /songs/catalog
  - Auth: optional
  - Response: { items: Song[] }
- GET /songs/genres
  - Auth: optional
  - Response: { genres: string[] }
- GET /songs/by-genre?genre=GENRE
  - Auth: optional
  - Response: { items: Song[] }
- GET /songs/search?q=TERM
  - Auth: optional
  - Response: { items: Song[] }

Polls (admin)
- POST /polls
  - Auth: admin
  - Request: { title: string, songs: string[] }
  - Response: Poll
- PATCH /polls/:id/close
  - Auth: admin
  - Request: none
  - Response: Poll
- PATCH /polls/:id/vote
  - Auth: admin
  - Request: { songId: string, voterId?: string }
  - Response: Poll

Queue (public + DJ + admin)
- POST /queue/request
  - Auth: optional
  - Request: { songId?: string | null, songTitle: string, artist: string, genre: string }
  - Response: QueueItem
- POST /queue/insert
  - Auth: dj or admin
  - Request: { songId?: string | null, songTitle: string, artist: string, genre: string }
  - Response: QueueItem
- PATCH /queue/vote
  - Auth: optional
  - Request: { queueItemId: string }
  - Response: QueueItem
- PATCH /queue/accept
  - Auth: dj
  - Request: { queueItemId: string }
  - Response: QueueItem
- PATCH /queue/reject
  - Auth: dj
  - Request: { queueItemId: string }
  - Response: QueueItem
- PATCH /queue/revert
  - Auth: dj
  - Request: { queueItemId: string }
  - Response: QueueItem
- PATCH /queue/:id/status
  - Auth: admin
  - Request: { status: QueueStatus }
  - Response: QueueItem
- PATCH /queue/:id/priority
  - Auth: admin
  - Request: { priority: number }
  - Response: QueueItem
- POST /queue/force-play
  - Auth: admin
  - Request: { queueItemId: string }
  - Response: QueueItem
- DELETE /queue
  - Auth: admin
  - Response: { ok: true }
- DELETE /queue/:id
  - Auth: optional
  - Response: { ok: true }

History (DJ)
- GET /history/accepted
  - Auth: dj
  - Response: { items: QueueItem[] }
- GET /history/rejected
  - Auth: dj
  - Response: { items: QueueItem[] }

Activity logs (admin)
- POST /activity-logs
  - Auth: admin
  - Request: { type: string, description: string, user: string, metadata?: object }
  - Response: ActivityLog
- DELETE /activity-logs/:id
  - Auth: admin
  - Response: { ok: true }

System (admin)
- PATCH /system-mode
  - Auth: admin
  - Request: Partial<SystemMode>
  - Response: SystemMode
- PATCH /system-config
  - Auth: admin
  - Request: Partial<SystemConfig>
  - Response: SystemConfig
- PATCH /settings/wait-time
  - Auth: admin
  - Request: { waitTimeMinutes: number }
  - Response: Settings

Core schemas (shape only)
- SongCreate: { title, artist, genre, album?, duration?, language?, explicit?, status? }
- Song: SongCreate & { id, addedDate, playCount, voteCount, created_at, updated_at, deleted_at? }
- Poll: { id, title, status, totalVotes, closedAt?, created_at, updated_at, deleted_at? }
- QueueItem: { id, songId?, songTitle, artist, genre, votes, requestedBy, timestamp, status, priority, venueId?, created_at, updated_at, deleted_at? }
- ActivityLog: { id, type, description, timestamp, user, metadata, created_at, updated_at, deleted_at? }
- Venue: { id, name, logo?, accentColor?, address?, city?, state?, zipCode?, phone?, email?, created_at, updated_at, deleted_at? }
- SystemMode: { id, isLive, isMaintenance, isOverrideEnabled, created_at, updated_at }
- SystemConfig: { id, waitTimeMinutes?, created_at, updated_at, ... }
- Settings: { id, waitTimeMinutes, created_at, updated_at }
