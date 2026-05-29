import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  createPrivateRoom,
  type CreatePrivateRoomPayload,
  type RoomResponse,
} from "@/features/chat/services";

export type StartPrivateChatInput = {
  userId: string;
};

export const useCreatePrivateRoomMutation = () => {
  const currentUserId = useAuthStore((state) => state.user?.id);

  return useMutation<RoomResponse, Error, StartPrivateChatInput>({
    mutationFn: async ({ userId }) => {
      if (!currentUserId) {
        throw new Error("Không tìm thấy người dùng hiện tại.");
      }

      const payload: CreatePrivateRoomPayload = {
        name: "Chat 1-1",
        type: "private",
        memberIds: [currentUserId, userId],
      };

      return createPrivateRoom(payload);
    },
  });
};
