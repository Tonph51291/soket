export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderUsername?: string;
  senderAvatar?: string | null;
  text: string;
  type?: string;
  createdAt: string;
  readBy?: string[];
};

export type RoomMessageSender = {
  id: string;
  username: string;
  avatar: string | null;
};

export type RoomMessageApiItem = {
  id: string;
  roomId: string;
  sender: RoomMessageSender;
  text: string;
  type: string;
  createdAt: string;
  readBy: string[];
};

export type RoomMessagesResponse = {
  data: {
    items: RoomMessageApiItem[];
    nextCursor: string | null;
    hasMore: boolean;
  };
};
