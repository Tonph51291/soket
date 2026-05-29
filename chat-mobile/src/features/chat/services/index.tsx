import { apiClient } from "@/config/api.config";

export type CreatePrivateRoomPayload = {
  name: string;
  type: "private";
  memberIds: [string, string];
};

export type RoomResponse = {
  id?: string;
  _id?: string;
  name: string;
  type: "private" | "group";
  memberIds: string[];
};

export const listUser = async () => {
  const response = await apiClient.get("/users");
  return response.data;
};

export const createPrivateRoom = async (payload: CreatePrivateRoomPayload) => {
  const response = await apiClient.post<RoomResponse | { data: RoomResponse }>(
    "/rooms",
    payload,
  );

  const data = response.data as RoomResponse & { data?: RoomResponse };

  return data.data ?? data;
};
