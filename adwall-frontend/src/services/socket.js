import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (accessToken) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
    auth: { token: accessToken },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
  socket.on("disconnect", () => console.log("🔴 Socket disconnected"));
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
