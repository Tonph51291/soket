import { create } from "zustand";

export type ChatMessage = {
  id: string;
  roomId: string;
  text: string;
  senderId?: string;
  createdAt?: string;
};

type ChatState = {
  messagesByRoomId: Record<string, ChatMessage[]>;
  addMessage: (message: ChatMessage) => void;
  clearRoom: (roomId: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messagesByRoomId: {},
  addMessage: (message) =>
    set((state) => {
      const currentMessages = state.messagesByRoomId[message.roomId] ?? [];

      return {
        messagesByRoomId: {
          ...state.messagesByRoomId,
          [message.roomId]: [...currentMessages, message],
        },
      };
    }),
  clearRoom: (roomId) =>
    set((state) => {
      const nextMessagesByRoomId = { ...state.messagesByRoomId };
      delete nextMessagesByRoomId[roomId];

      return {
        messagesByRoomId: nextMessagesByRoomId,
      };
    }),
}));
