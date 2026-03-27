import { Server } from "socket.io";
import { CORS_ORIGINS } from "@/config/cors";

let io: Server;

/**
 * Initialize Socket.IO server on the given HTTP server
 */
/**
 * Initialize Socket.IO server on the given HTTP server
 */
export function initSocket(server: import("http").Server) {
  io = new Server(server, {
    path: "/ws",
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    },
    // Explicitly set transports
    transports: ["websocket", "polling"],
    // Allow upgrades
    allowUpgrades: true,
    // Set ping timeout
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", socket => {
    socket.on("disconnect", _reason => {
      // Handle disconnect
    });
  });

  return io;
}

/**
 * Retrieve the initialized Socket.IO instance
 */
export function getSocket(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return io;
}
