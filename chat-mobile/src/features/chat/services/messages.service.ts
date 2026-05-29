import { apiClient } from "@/config/api.config";

import {
  type ChatMessage,
  type RoomMessageApiItem,
  type RoomMessagesResponse,
} from "@/features/chat/types/chat.types";

export const roomMessagesQueryKey = (roomId: string) =>
  ["room-messages", roomId] as const;

function mapRoomMessage(item: RoomMessageApiItem): ChatMessage {
  return {
    id: item.id,
    roomId: item.roomId,
    senderId: item.sender.id,
    senderUsername: item.sender.username,
    senderAvatar: item.sender.avatar,
    text: item.text,
    type: item.type,
    createdAt: item.createdAt,
    readBy: item.readBy,
  };
}

export async function getRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get<
    RoomMessagesResponse | { data: RoomMessagesResponse["data"] }
  >(`/rooms/${roomId}/messages`);

  const data =
    (
      response.data as RoomMessagesResponse & {
        data?: RoomMessagesResponse["data"];
      }
    ).data ?? response.data;

  return data.items.map(mapRoomMessage);
}

export function appendRoomMessage(
  currentMessages: ChatMessage[] | undefined,
  nextMessage: ChatMessage,
) {
  const messages = currentMessages ?? [];

  if (messages.some((message) => message.id === nextMessage.id)) {
    return messages;
  }

  return [...messages, nextMessage];
}
