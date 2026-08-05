# Integration Order and Phases

Phase 1: Backend contracts
- Implement GET /system-mode
- Implement POST /songs/bulk
- Emit activity_logs.updated
- Verify existing endpoints align to contracts/rest.md

Phase 2: Socket backbone
- Ensure Socket.IO server available to all frontends
- Validate event names and payloads in contracts/socket-events.md

Phase 3: Admin integration
- Wire API client and admin REST calls
- Add socket listeners and state updates
- Verify dashboard, control panel, and analytics flows

Phase 4: DJ integration
- Wire DJ REST calls and auth handling
- Add socket listeners and state updates
- Verify accept/reject/revert flows and history

Phase 5: Queue integration
- Wire queue REST calls
- Add socket listeners
- Verify request, vote, and live updates

Verification checkpoints
- REST: all endpoints return expected shapes
- Socket: each event updates UI state as defined
- Cross-frontend: changes in one client reflect in others
