// src/socket.ts
import { Server } from "socket.io";

let io: Server;

/**
 * Initialize Socket.IO server on the given HTTP server
 */
export function initSocket(server: import("http").Server) {
  io = new Server(server, {
    path: "/ws",
    cors: { origin: "*" },
  });
  return io;
}

/**
 * Retrieve the initialized Socket.IO instance
 */
export function getSocket(): Server {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initSocket(server) first."
    );
  }
  return io;
}
