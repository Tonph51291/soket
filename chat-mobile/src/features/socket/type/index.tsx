// socket.types.ts

export type SocketAuth = {
  userId: string;
};

export type JoinRoomPayload = {
  roomId: string;
};

export type LeaveRoomPayload = {
  roomId: string;
};

export type SendMessagePayload = {
  roomId: string;
  senderId: string;
  text: string;
  createdAt?: string;
};

export type ReceiveMessagePayload = {
  id: string; // server tự sinh
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO string
};

export type SocketErrorPayload = {
  message: string;
};

// Client emit lên server
export interface ClientToServerEvents {
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
}

// Server emit về client
export interface ServerToClientEvents {
  receive_message: (payload: ReceiveMessagePayload) => void;
  error: (payload: SocketErrorPayload) => void;
}
