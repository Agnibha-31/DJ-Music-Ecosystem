# Prompt-8 Readiness Checklist

Contracts
- REST contract frozen (contracts/rest.md)
- Enum mappings frozen (contracts/enums.md)
- Socket event contract frozen (contracts/socket-events.md)

Coverage
- Admin, DJ, Queue TODOs fully mapped to REST + socket work
- Backend changes identified and scoped

Testability
- Auth flows validated for admin and DJ
- Public queue endpoints validated for guest usage
- Socket events verified for each frontend

Definition of Done
- Backend changes implemented and tested
- All frontend API clients wired with correct mappings
- All socket listeners wired and updating state
- End-to-end smoke tests pass for admin, DJ, and queue flows
