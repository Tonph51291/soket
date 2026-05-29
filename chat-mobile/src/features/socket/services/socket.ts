// services/socket.ts
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketAuth,
} from "../type";

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = "http://10.0.2.2:4000"; // đổi thành IP + port thật

let socket: ChatSocket | null = null;

export const connectSocket = (userId: string): ChatSocket => {
  const auth: SocketAuth = { userId };

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("Connection error:", err);
  });

  socket.on("error", (payload) => {
    console.log("⚠️ Server error:", payload.message);
  });

  return socket;
};

export const getSocket = (): ChatSocket => {
  if (!socket)
    throw new Error("❌ Socket chưa kết nối! Gọi connectSocket() trước.");
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
