import { Server } from "socket.io";
let io = null;
const ADMIN_ROOM = "admin_global";
const venueRoom = (venueId) => `venue_${venueId}`;
const djAccessRoom = (requestId) => `dj_access_${requestId}`;
const normalizeVenueId = (value) => {
    const venueId = String(value ?? "").trim();
    return venueId || null;
};
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });
    io.on("connection", (socket) => {
        socket.emit("connected", { ok: true });
        socket.on("join_admin", () => {
            socket.join(ADMIN_ROOM);
        });
        socket.on("join_venue", ({ venueId } = {}) => {
            const normalizedVenueId = normalizeVenueId(venueId);
            if (!normalizedVenueId) {
                return;
            }
            const previousVenueRoom = socket.data?.venueRoom;
            if (previousVenueRoom && previousVenueRoom !== venueRoom(normalizedVenueId)) {
                socket.leave(previousVenueRoom);
            }
            const nextRoom = venueRoom(normalizedVenueId);
            socket.join(nextRoom);
            socket.data = { ...socket.data, venueRoom: nextRoom };
        });
        socket.on("leave_venue", () => {
            const previousVenueRoom = socket.data?.venueRoom;
            if (previousVenueRoom) {
                socket.leave(previousVenueRoom);
            }
            socket.data = { ...socket.data, venueRoom: undefined };
        });
        socket.on("join_dj_access", ({ requestId } = {}) => {
            const normalizedRequestId = String(requestId ?? "").trim();
            if (!normalizedRequestId) {
                return;
            }
            const room = djAccessRoom(normalizedRequestId);
            socket.join(room);
            socket.data = { ...socket.data, djAccessRoom: room };
        });
        socket.on("leave_dj_access", () => {
            const previousRoom = socket.data?.djAccessRoom;
            if (previousRoom) {
                socket.leave(previousRoom);
            }
            socket.data = { ...socket.data, djAccessRoom: undefined };
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error("socket not initialized");
    }
    return io;
};
export const emitVenueEvent = (eventName, venueId, payload) => {
    const normalizedVenueId = normalizeVenueId(venueId);
    if (!normalizedVenueId) {
        getIO().to(ADMIN_ROOM).emit(eventName, payload);
        return;
    }
    const instance = getIO();
    instance.to(venueRoom(normalizedVenueId)).emit(eventName, payload);
    instance.to(ADMIN_ROOM).emit(eventName, payload);
};
export const emitToVenueRooms = (eventName, venueIds, payload) => {
    const instance = getIO();
    const uniqueVenueIds = Array.from(new Set(venueIds
        .map((venueId) => normalizeVenueId(venueId))
        .filter((venueId) => Boolean(venueId))));
    for (const venueId of uniqueVenueIds) {
        instance.to(venueRoom(venueId)).emit(eventName, payload);
    }
};
export const emitAdminEvent = (eventName, payload) => {
    getIO().to(ADMIN_ROOM).emit(eventName, payload);
};
export const emitDjAccessEvent = (eventName, requestId, payload) => {
    const normalizedRequestId = String(requestId ?? "").trim();
    if (!normalizedRequestId) {
        return;
    }
    getIO().to(djAccessRoom(normalizedRequestId)).emit(eventName, payload);
};
