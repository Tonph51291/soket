import { randomUUID } from "crypto";
import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";

type ClientToServerEvents = {
  join_room: (payload: { roomId: string }) => void;
  leave_room: (payload: { roomId: string }) => void;
  send_message: (payload: {
    roomId: string;
    senderId: string;
    text: string;
    createdAt?: string;
  }) => void;
};

type ServerToClientEvents = {
  receive_message: (payload: {
    id: string;
    roomId: string;
    senderId: string;
    text: string;
    createdAt: string;
  }) => void;
  error: (payload: { message: string }) => void;
};

type SocketData = {
  userId: string;
};

type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export class RealtimeGateway {
  private readonly io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    this.io.use((socket, next) => {
      const userId = socket.handshake.auth.userId;
      if (typeof userId !== "string" || !userId.trim()) {
        next(new Error("UNAUTHORIZED: Missing handshake.auth.userId"));
        return;
      }

      socket.data.userId = userId;
      next();
    });

    this.bindConnectionEvents();
  }

  private bindConnectionEvents(): void {
    this.io.on("connection", (socket) => {
      this.registerJoinRoom(socket);
      this.registerLeaveRoom(socket);
      this.registerSendMessage(socket);
    });
  }

  private registerJoinRoom(socket: RealtimeSocket): void {
    socket.on("join_room", ({ roomId }) => {
      if (!roomId?.trim()) {
        socket.emit("error", { message: "roomId là bắt buộc" });
        return;
      }

      void socket.join(roomId);
    });
  }

  private registerLeaveRoom(socket: RealtimeSocket): void {
    socket.on("leave_room", ({ roomId }) => {
      if (!roomId?.trim()) {
        socket.emit("error", { message: "roomId là bắt buộc" });
        return;
      }

      void socket.leave(roomId);
    });
  }

  private registerSendMessage(socket: RealtimeSocket): void {
    socket.on("send_message", ({ roomId, senderId, text, createdAt }) => {
      if (!roomId?.trim() || !text?.trim()) {
        socket.emit("error", { message: "roomId và text là bắt buộc" });
        return;
      }

      const message = {
        id: this.createMessageId(),
        roomId,
        senderId: socket.data.userId || senderId,
        text: text.trim(),
        createdAt: this.normalizeCreatedAt(createdAt),
      };

      this.io.to(roomId).emit("receive_message", message);
    });
  }

  private createMessageId(): string {
    return typeof randomUUID === "function"
      ? randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }

  private normalizeCreatedAt(createdAt?: string): string {
    if (!createdAt) {
      return new Date().toISOString();
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  public close(): void {
    this.io.close();
  }
}

export const createRealtimeGateway = (
  httpServer: HttpServer,
): RealtimeGateway => new RealtimeGateway(httpServer);
