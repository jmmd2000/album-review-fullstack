import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_URL!
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;

/**
 * Returns a Socket.IO instance that connects once and disconnects on unmount
 */
export function useSocket(): Socket {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      path: "/ws",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      timeout: 20000,
    });
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef.current;
}
