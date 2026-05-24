import { Types } from "mongoose";
import { MessageModel } from "../models/Message";
import { RoomModel } from "../models/Room";
import { ApiError } from "../utils/ApiError";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { isValidObjectId } from "../utils/objectId";
import { assertRoomMembership } from "./roomService";

export type MessageResponse = {
  id: string;
  roomId: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  text: string;
  type: "text" | "image" | "file";
  createdAt: Date;
  readBy: string[];
};

export type ChatEventMessage = {
  messageId: string;
  roomId: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  text: string;
  type: "text" | "image" | "file";
  createdAt: Date;
};

type PopulatedMessage = {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  sender: { _id: Types.ObjectId; username: string; avatar?: string | null };
  text: string;
  type: "text" | "image" | "file";
  createdAt: Date;
  readBy: Types.ObjectId[];
};

const formatMessage = (message: {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  sender: { _id: Types.ObjectId; username: string; avatar?: string | null };
  text: string;
  type: "text" | "image" | "file";
  createdAt: Date;
  readBy: Types.ObjectId[];
}): MessageResponse => ({
  id: message._id.toString(),
  roomId: message.roomId.toString(),
  sender: {
    id: message.sender._id.toString(),
    username: message.sender.username,
    avatar: message.sender.avatar ?? null,
  },
  text: message.text,
  type: message.type,
  createdAt: message.createdAt,
  readBy: message.readBy.map((member) => member.toString()),
});

export const createMessage = async (input: {
  roomId: string;
  senderId: string;
  text: string;
  type: "text" | "image" | "file";
}): Promise<ChatEventMessage> => {
  if (!isValidObjectId(input.roomId)) {
    throw new ApiError(400, "INVALID_ROOM_ID", "Room id không hợp lệ");
  }

  await assertRoomMembership(input.roomId, input.senderId);

  const message = await MessageModel.create({
    roomId: new Types.ObjectId(input.roomId),
    sender: new Types.ObjectId(input.senderId),
    text: input.text.trim(),
    type: input.type,
    readBy: [new Types.ObjectId(input.senderId)],
  });

  await RoomModel.updateOne(
    { _id: input.roomId },
    {
      $set: {
        lastMessage: {
          messageId: message._id,
          sender: new Types.ObjectId(input.senderId),
          text: input.text.trim(),
          type: input.type,
          createdAt: message.createdAt,
        },
      },
    },
  );

  const populated = (await MessageModel.findById(message.id)
    .populate("sender", "username avatar")
    .lean()) as unknown as PopulatedMessage | null;
  if (!populated) {
    throw new ApiError(500, "MESSAGE_CREATE_FAILED", "Không thể tạo tin nhắn");
  }

  return {
    messageId: populated._id.toString(),
    roomId: populated.roomId.toString(),
    sender: {
      id: populated.sender._id.toString(),
      username: populated.sender.username,
      avatar: populated.sender.avatar ?? null,
    },
    text: populated.text,
    type: populated.type,
    createdAt: populated.createdAt,
  };
};

export const listRoomMessages = async (input: {
  roomId: string;
  userId: string;
  cursor?: string;
  page?: number;
  limit: number;
}): Promise<{
  items: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}> => {
  if (!isValidObjectId(input.roomId)) {
    throw new ApiError(400, "INVALID_ROOM_ID", "Room id không hợp lệ");
  }

  await assertRoomMembership(input.roomId, input.userId);

  const query: Record<string, unknown> = {
    roomId: new Types.ObjectId(input.roomId),
  };
  let skip = 0;

  if (input.cursor) {
    const decoded = decodeCursor(input.cursor);
    query.$or = [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      {
        createdAt: new Date(decoded.createdAt),
        _id: { $lt: new Types.ObjectId(decoded.id) },
      },
    ];
  } else if (typeof input.page === "number" && input.page > 1) {
    skip = (input.page - 1) * input.limit;
  }

  const rawMessages = (await MessageModel.find(query)
    .populate("sender", "username avatar")
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(input.limit + 1)
    .lean()) as unknown as PopulatedMessage[];

  const hasMore = rawMessages.length > input.limit;
  const sliced = hasMore ? rawMessages.slice(0, input.limit) : rawMessages;
  const orderedMessages = sliced.reverse();
  const items = orderedMessages.map((message) => formatMessage(message));
  const oldestMessage = sliced[sliced.length - 1];
  const nextCursor =
    hasMore && oldestMessage
      ? encodeCursor({
          createdAt: oldestMessage.createdAt.toISOString(),
          id: oldestMessage._id.toString(),
        })
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
};

export const ensureMessageRateLimit = async (userId: string): Promise<void> => {
  // Giới hạn 1 tin nhắn / giây cho mỗi user bằng Redis.
  const { redisClient } = await import("../config/redis");
  const key = `rate:message:${userId}`;
  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, 1);
  }

  if (count > 1) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Bạn đang gửi quá nhanh. Vui lòng thử lại sau 1 giây.",
    );
  }
};
