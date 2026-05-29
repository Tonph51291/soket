import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import {
  appendRoomMessage,
  roomMessagesQueryKey,
} from "@/features/chat/services/messages.service";
import { type ChatMessage } from "@/features/chat/types/chat.types";
import { getSocket } from "@/features/socket/services/socket";
import {
  type ClientToServerEvents,
  type ReceiveMessagePayload,
  type SocketErrorPayload,
} from "@/features/socket/type";

type ChatSocket = Socket<
  {
    receive_message: (payload: ReceiveMessagePayload) => void;
    error: (payload: SocketErrorPayload) => void;
  },
  ClientToServerEvents
>;

type UseChatSocketParams = {
  userId: string;
  roomId: string;
  enabled?: boolean;
};

type UseChatSocketResult = {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  joinRoom: () => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  retryConnection: () => void;
};

function isNonEmptyText(value: string) {
  return value.trim().length > 0;
}

// Hook này quản lý toàn bộ vòng đời kết nối Socket.IO cho phòng chat hiện tại.
export function useChatSocket({
  userId,
  roomId,
  enabled = true,
}: UseChatSocketParams): UseChatSocketResult {
  const queryClient = useQueryClient();
  const socketRef = useRef<ChatSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Gửi yêu cầu tham gia phòng chat nếu socket đã kết nối.
  const joinRoom = useCallback(() => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      return;
    }

    // Chỉ join đúng phòng hiện tại để tránh nghe nhầm message từ phòng khác.
    socket.emit("join_room", { roomId });
  }, [roomId]);

  // Gửi yêu cầu rời phòng chat hiện tại trước khi đổi phòng hoặc thoát màn hình.
  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      return;
    }

    socket.emit("leave_room", { roomId });
  }, [roomId]);

  // Gửi tin nhắn lên server bằng event send_message của Socket.IO.
  const sendMessage = useCallback(
    (text: string) => {
      const trimmedText = text.trim();

      if (!isNonEmptyText(trimmedText)) {
        return;
      }

      console.log("[chat] sendMessage requested", {
        roomId,
        senderId: userId,
        text: trimmedText,
      });

      const socket = socketRef.current;

      if (!socket?.connected) {
        console.log("[chat] socket chưa sẵn sàng để gửi tin");
        setConnectionError("Socket chưa sẵn sàng, vui lòng thử lại.");
        return;
      }

      console.log("[chat] emit send_message", {
        roomId,
        senderId: userId,
        text: trimmedText,
      });

      socket.emit("send_message", {
        roomId,
        senderId: userId,
        text: trimmedText,
        createdAt: new Date().toISOString(),
      });
    },
    [roomId, userId],
  );

  // Nhận message từ server và lưu vào cache nếu message thuộc đúng phòng.
  const handleReceiveMessage = useCallback(
    (payload: ReceiveMessagePayload) => {
      console.log(payload);
      if (payload.roomId !== roomId) {
        return;
      }

      const message: ChatMessage = {
        id: payload.id,
        roomId: payload.roomId,
        senderId: payload.senderId,
        text: payload.text,
        createdAt: payload.createdAt,
      };

      queryClient.setQueryData<ChatMessage[]>(
        roomMessagesQueryKey(roomId),
        (currentMessages) => appendRoomMessage(currentMessages, message),
      );
    },
    [queryClient, roomId],
  );

  // Lưu lỗi từ server để UI có thể hiển thị thông báo rõ ràng.
  const handleSocketError = useCallback((payload: SocketErrorPayload) => {
    setConnectionError(payload.message);
  }, []);

  // Khởi tạo socket, gắn listener và trả về hàm cleanup để dọn dẹp đầy đủ.
  const establishConnection = useCallback(() => {
    if (!enabled) {
      return null;
    }

    if (!userId || !roomId) {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError("Thiếu userId hoặc roomId.");
      socketRef.current = null;
      return null;
    }

    let socket: ChatSocket;

    try {
      socket = getSocket();
    } catch {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError("Socket chưa sẵn sàng.");
      socketRef.current = null;
      return null;
    }

    setIsConnecting(!socket.connected);
    setConnectionError(null);
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      socket.emit("join_room", { roomId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError("Không thể kết nối Socket.IO.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("error", handleSocketError);

    if (socket.connected) {
      setIsConnected(true);
      setIsConnecting(false);
      socket.emit("join_room", { roomId });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("error", handleSocketError);
      socket.emit("leave_room", { roomId });
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [enabled, handleReceiveMessage, handleSocketError, roomId, userId]);

  // Tự kết nối lại khi userId, roomId hoặc trạng thái enabled thay đổi.
  useEffect(() => {
    const cleanup = establishConnection();

    return () => {
      cleanup?.();
    };
  }, [establishConnection]);

  // Dùng khi UI bấm “Thử lại” để reset socket và tạo kết nối mới.
  const retryConnection = useCallback(() => {
    if (!enabled) {
      return;
    }

    socketRef.current = null;
    establishConnection();
  }, [enabled, establishConnection]);

  return useMemo(
    () => ({
      isConnected,
      isConnecting,
      connectionError,
      joinRoom,
      leaveRoom,
      sendMessage,
      retryConnection,
    }),
    [
      connectionError,
      isConnected,
      isConnecting,
      joinRoom,
      leaveRoom,
      retryConnection,
      sendMessage,
    ],
  );
}
