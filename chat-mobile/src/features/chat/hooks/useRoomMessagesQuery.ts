import { useQuery } from "@tanstack/react-query";

import {
  getRoomMessages,
  roomMessagesQueryKey,
} from "@/features/chat/services/messages.service";

export function useRoomMessagesQuery(roomId: string) {
  const query = useQuery({
    queryKey: roomMessagesQueryKey(roomId),
    queryFn: () => getRoomMessages(roomId),
    enabled: Boolean(roomId),
  });

  return {
    ...query,
    messages: query.data ?? [],
  };
}
