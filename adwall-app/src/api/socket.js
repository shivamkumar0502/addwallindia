import { io } from "socket.io-client";
import Constants from "expo-constants";

let socket = null;

const SOCKET_URL = (Constants.expoConfig?.extra?.apiUrl || "http://192.168.1.6:5002/api").replace("/api", "");

export const connectSocket = (accessToken) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
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
