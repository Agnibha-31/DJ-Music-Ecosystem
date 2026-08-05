import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | null = null;

const ADMIN_ROOM = "admin_global";
const venueRoom = (venueId: string) => `venue_${venueId}`;
const djAccessRoom = (requestId: string) => `dj_access_${requestId}`;

const normalizeVenueId = (value: unknown) => {
  const venueId = String(value ?? "").trim();
  return venueId || null;
};

export const initSocket = (server: HttpServer) => {
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

    socket.on("join_venue", ({ venueId }: { venueId?: string } = {}) => {
      const normalizedVenueId = normalizeVenueId(venueId);
      if (!normalizedVenueId) {
        return;
      }

      const previousVenueRoom = socket.data?.venueRoom as string | undefined;
      if (previousVenueRoom && previousVenueRoom !== venueRoom(normalizedVenueId)) {
        socket.leave(previousVenueRoom);
      }

      const nextRoom = venueRoom(normalizedVenueId);
      socket.join(nextRoom);
      socket.data = { ...socket.data, venueRoom: nextRoom };
    });

    socket.on("leave_venue", () => {
      const previousVenueRoom = socket.data?.venueRoom as string | undefined;
      if (previousVenueRoom) {
        socket.leave(previousVenueRoom);
      }
      socket.data = { ...socket.data, venueRoom: undefined };
    });

    socket.on("join_dj_access", ({ requestId }: { requestId?: string } = {}) => {
      const normalizedRequestId = String(requestId ?? "").trim();
      if (!normalizedRequestId) {
        return;
      }
      const room = djAccessRoom(normalizedRequestId);
      socket.join(room);
      socket.data = { ...socket.data, djAccessRoom: room };
    });

    socket.on("leave_dj_access", () => {
      const previousRoom = socket.data?.djAccessRoom as string | undefined;
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

export const emitVenueEvent = (eventName: string, venueId: string | null | undefined, payload: unknown) => {
  const normalizedVenueId = normalizeVenueId(venueId);
  if (!normalizedVenueId) {
    getIO().to(ADMIN_ROOM).emit(eventName, payload);
    return;
  }

  const instance = getIO();
  instance.to(venueRoom(normalizedVenueId)).emit(eventName, payload);
  instance.to(ADMIN_ROOM).emit(eventName, payload);
};

export const emitToVenueRooms = (eventName: string, venueIds: Array<string | null | undefined>, payload: unknown) => {
  const instance = getIO();
  const uniqueVenueIds = Array.from(
    new Set(
      venueIds
        .map((venueId) => normalizeVenueId(venueId))
        .filter((venueId): venueId is string => Boolean(venueId))
    )
  );

  for (const venueId of uniqueVenueIds) {
    instance.to(venueRoom(venueId)).emit(eventName, payload);
  }
};

export const emitAdminEvent = (eventName: string, payload: unknown) => {
  getIO().to(ADMIN_ROOM).emit(eventName, payload);
};

export const emitDjAccessEvent = (eventName: string, requestId: string | null | undefined, payload: unknown) => {
  const normalizedRequestId = String(requestId ?? "").trim();
  if (!normalizedRequestId) {
    return;
  }
  getIO().to(djAccessRoom(normalizedRequestId)).emit(eventName, payload);
};
