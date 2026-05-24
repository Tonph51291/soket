import type { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { redisPublisher, redisSubscriber } from "../config/redis";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import {
  createMessage,
  ensureMessageRateLimit,
} from "../services/messageService";
import {
  setUserOffline,
  setUserOnline,
  refreshUserPresence,
  PRESENCE_CHANNEL,
} from "../services/presenceService";
import { assertRoomMembership, getRoomEntity } from "../services/roomService";

type ClientEvent = {
  event: string;
  data?: Record<string, unknown>;
};

type ClientSocket = WebSocket & {
  user?: { id: string; email: string; username: string };
  rooms: Set<string>;
  isAlive: boolean;
  authTimeout?: NodeJS.Timeout;
};

type ChatEventPayload =
  | {
      event: "new_message";
      data: {
        messageId: string;
        roomId: string;
        sender: { id: string; username: string; avatar: string | null };
        text: string;
        createdAt: Date;
      };
    }
  | {
      event: "user_typing";
      data: { roomId: string; userId: string; username: string };
    }
  | { event: "user_stop_typing"; data: { roomId: string; userId: string } };

const CHAT_CHANNEL = "chat:events";

export class RealtimeGateway {
  private readonly wss: WebSocketServer;

  private readonly clientsByUserId = new Map<string, Set<ClientSocket>>();

  private heartbeatTimer?: NodeJS.Timeout;

  constructor(httpServer: HttpServer) {
    this.wss = new WebSocketServer({ server: httpServer, path: "/ws" });
    void this.initSubscriber();
    this.bindConnectionEvents();
  }

  private async initSubscriber(): Promise<void> {
    await redisSubscriber.subscribe(CHAT_CHANNEL, PRESENCE_CHANNEL);

    redisSubscriber.on("message", (_channel, rawMessage) => {
      try {
        const message = JSON.parse(rawMessage) as
          | ChatEventPayload
          | { event: "user_online" | "user_offline"; data: { userId: string } };
        if ("messageId" in message.data) {
          this.broadcastToRoom(
            message.data.roomId,
            message.event,
            message.data,
          );
          return;
        }

        if (message.event === "user_typing") {
          this.broadcastToRoom(
            message.data.roomId,
            message.event,
            message.data,
          );
          return;
        }

        if (message.event === "user_stop_typing") {
          this.broadcastToRoom(
            message.data.roomId,
            message.event,
            message.data,
          );
          return;
        }

        if (
          message.event === "user_online" ||
          message.event === "user_offline"
        ) {
          this.broadcastToAll(message.event, message.data);
        }
      } catch {
        // Bỏ qua payload lỗi từ Redis để không ảnh hưởng toàn bộ gateway.
      }
    });
  }

  private bindConnectionEvents(): void {
    this.wss.on("connection", (socket) => {
      const client = socket as ClientSocket;
      client.rooms = new Set<string>();
      client.isAlive = true;

      client.authTimeout = setTimeout(() => {
        if (!client.user) {
          client.close(4001, "Authentication timeout");
        }
      }, 10_000);

      client.on("pong", () => {
        client.isAlive = true;
        if (client.user) {
          void refreshUserPresence(client.user.id, client.user.username);
        }
      });

      client.on("message", (raw) => {
        void this.handleMessage(client, raw.toString()).catch((error) => {
          this.sendError(client, error);
        });
      });

      client.on("close", () => {
        this.removeClient(client);
      });
    });

    this.heartbeatTimer = setInterval(() => {
      for (const client of this.wss.clients as Set<ClientSocket>) {
        if (!client.user) {
          continue;
        }

        if (!client.isAlive) {
          client.terminate();
          this.removeClient(client);
          continue;
        }

        client.isAlive = false;
        client.ping();
      }
    }, 30_000);
  }

  private async handleMessage(
    client: ClientSocket,
    rawMessage: string,
  ): Promise<void> {
    const payload = JSON.parse(rawMessage) as ClientEvent;
    if (!payload?.event) {
      throw new ApiError(
        400,
        "INVALID_EVENT",
        "Sự kiện WebSocket không hợp lệ",
      );
    }

    switch (payload.event) {
      case "auth":
        await this.handleAuth(client, payload.data);
        return;
      case "join_room":
        await this.handleJoinRoom(client, payload.data);
        return;
      case "leave_room":
        await this.handleLeaveRoom(client, payload.data);
        return;
      case "send_message":
        await this.handleSendMessage(client, payload.data);
        return;
      case "typing_start":
        await this.handleTyping(client, payload.data, true);
        return;
      case "typing_stop":
        await this.handleTyping(client, payload.data, false);
        return;
      default:
        throw new ApiError(
          400,
          "UNKNOWN_EVENT",
          `Không hỗ trợ sự kiện ${payload.event}`,
        );
    }
  }

  private async handleAuth(
    client: ClientSocket,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const token = typeof data?.token === "string" ? data.token : "";
    if (!token) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Thiếu JWT để xác thực WebSocket",
      );
    }

    const user = verifyAccessToken(token);
    client.user = user;

    clearTimeout(client.authTimeout);
    client.authTimeout = undefined;

    const existingClients =
      this.clientsByUserId.get(user.id) ?? new Set<ClientSocket>();
    const isFirstConnection = existingClients.size === 0;

    existingClients.add(client);
    this.clientsByUserId.set(user.id, existingClients);

    if (isFirstConnection) {
      await setUserOnline(user.id, user.username);
    } else {
      await refreshUserPresence(user.id, user.username);
    }
  }

  private async handleJoinRoom(
    client: ClientSocket,
    data?: Record<string, unknown>,
  ): Promise<void> {
    this.requireAuth(client);
    const user = client.user!;
    const roomId = typeof data?.roomId === "string" ? data.roomId : "";
    if (!roomId) {
      throw new ApiError(400, "INVALID_ROOM", "Thiếu roomId");
    }

    await assertRoomMembership(roomId, user.id);
    client.rooms.add(roomId);
  }

  private async handleLeaveRoom(
    client: ClientSocket,
    data?: Record<string, unknown>,
  ): Promise<void> {
    this.requireAuth(client);
    const roomId = typeof data?.roomId === "string" ? data.roomId : "";
    if (!roomId) {
      throw new ApiError(400, "INVALID_ROOM", "Thiếu roomId");
    }

    client.rooms.delete(roomId);
  }

  private async handleSendMessage(
    client: ClientSocket,
    data?: Record<string, unknown>,
  ): Promise<void> {
    this.requireAuth(client);
    const user = client.user!;
    const roomId = typeof data?.roomId === "string" ? data.roomId : "";
    const text = typeof data?.text === "string" ? data.text : "";
    const type =
      data?.type === "image" || data?.type === "file" ? data.type : "text";

    if (!roomId || !text.trim()) {
      throw new ApiError(
        400,
        "INVALID_MESSAGE",
        "Thiếu roomId hoặc nội dung tin nhắn",
      );
    }

    await ensureMessageRateLimit(user.id);
    const message = await createMessage({
      roomId,
      senderId: user.id,
      text,
      type,
    });

    await redisPublisher.publish(
      CHAT_CHANNEL,
      JSON.stringify({
        event: "new_message",
        data: message,
      }),
    );
  }

  private async handleTyping(
    client: ClientSocket,
    data?: Record<string, unknown>,
    isTyping = true,
  ): Promise<void> {
    this.requireAuth(client);
    const user = client.user!;
    const roomId = typeof data?.roomId === "string" ? data.roomId : "";
    if (!roomId) {
      throw new ApiError(400, "INVALID_ROOM", "Thiếu roomId");
    }

    await assertRoomMembership(roomId, user.id);

    await redisPublisher.publish(
      CHAT_CHANNEL,
      JSON.stringify({
        event: isTyping ? "user_typing" : "user_stop_typing",
        data: isTyping
          ? {
              roomId,
              userId: user.id,
              username: user.username,
            }
          : {
              roomId,
              userId: user.id,
            },
      }),
    );
  }

  private removeClient(client: ClientSocket): void {
    if (!client.user) {
      if (client.authTimeout) {
        clearTimeout(client.authTimeout);
      }
      return;
    }

    const clients = this.clientsByUserId.get(client.user.id);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        this.clientsByUserId.delete(client.user.id);
        void setUserOffline(client.user.id);
      }
    }

    if (client.authTimeout) {
      clearTimeout(client.authTimeout);
    }
  }

  private broadcastToRoom(roomId: string, event: string, data: unknown): void {
    for (const client of this.wss.clients as Set<ClientSocket>) {
      if (
        !client.user ||
        !client.rooms.has(roomId) ||
        client.readyState !== WebSocket.OPEN
      ) {
        continue;
      }

      client.send(JSON.stringify({ event, data }));
    }
  }

  private broadcastToAll(event: string, data: unknown): void {
    for (const client of this.wss.clients as Set<ClientSocket>) {
      if (!client.user || client.readyState !== WebSocket.OPEN) {
        continue;
      }

      client.send(JSON.stringify({ event, data }));
    }
  }

  private sendError(client: ClientSocket, error: unknown): void {
    const message =
      error instanceof ApiError
        ? error.message
        : "Đã xảy ra lỗi trên WebSocket";
    const code = error instanceof ApiError ? error.code : "WEBSOCKET_ERROR";

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: "error", data: { code, message } }));
    }
  }

  private requireAuth(client: ClientSocket): void {
    if (!client.user) {
      throw new ApiError(401, "UNAUTHORIZED", "WebSocket chưa được xác thực");
    }
  }

  public close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    void redisSubscriber.unsubscribe(CHAT_CHANNEL, PRESENCE_CHANNEL);
    this.wss.close();
  }
}

export const createRealtimeGateway = (
  httpServer: HttpServer,
): RealtimeGateway => new RealtimeGateway(httpServer);
