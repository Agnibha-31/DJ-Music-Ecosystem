# Canonical Enums and Mappings

SongStatus
- Canonical: enabled | disabled | blocked
- Admin UI mapping: active -> enabled

PollStatus
- Canonical: open | closed
- Admin UI mapping: active -> open

QueueStatus
- Canonical: pending | accepted | rejected | playing | played
- Admin UI mapping: forced -> playing

QueuePriority
- Canonical: number
- Mapping: normal -> 0, high -> 1, override -> 2

SystemMode
- Canonical: isLive: boolean, isMaintenance: boolean, isOverrideEnabled: boolean
