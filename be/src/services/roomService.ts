import { Types } from "mongoose";
import { RoomModel } from "../models/Room";
import { UserModel } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { isValidObjectId } from "../utils/objectId";

type RoomResponse = {
  id: string;
  name: string;
  type: "private" | "group";
  members: Array<{
    id: string;
    username: string;
    email: string;
    avatar: string | null;
  }>;
  lastMessage: {
    messageId: string;
    sender: string;
    text: string;
    type: "text" | "image" | "file";
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

const formatRoom = (room: {
  _id: Types.ObjectId;
  name: string;
  type: "private" | "group";
  members: Array<{
    _id: Types.ObjectId;
    username: string;
    email: string;
    avatar?: string | null;
  }>;
  lastMessage?: {
    messageId: Types.ObjectId;
    sender: Types.ObjectId;
    text: string;
    type: "text" | "image" | "file";
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}): RoomResponse => ({
  id: room._id.toString(),
  name: room.name,
  type: room.type,
  members: room.members.map((member) => ({
    id: member._id.toString(),
    username: member.username,
    email: member.email,
    avatar: member.avatar ?? null,
  })),
  lastMessage: room.lastMessage
    ? {
        messageId: room.lastMessage.messageId.toString(),
        sender: room.lastMessage.sender.toString(),
        text: room.lastMessage.text,
        type: room.lastMessage.type,
        createdAt: room.lastMessage.createdAt,
      }
    : null,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const ensureUsersExist = async (
  memberIds: string[],
): Promise<Types.ObjectId[]> => {
  const validMemberIds = memberIds
    .filter(isValidObjectId)
    .map((id) => new Types.ObjectId(id));
  if (validMemberIds.length !== memberIds.length) {
    throw new ApiError(
      400,
      "INVALID_MEMBER_IDS",
      "Một hoặc nhiều memberId không hợp lệ",
    );
  }

  const users = await UserModel.find({ _id: { $in: validMemberIds } })
    .select("_id")
    .lean();
  if (users.length !== validMemberIds.length) {
    throw new ApiError(
      404,
      "USER_NOT_FOUND",
      "Một hoặc nhiều người dùng không tồn tại",
    );
  }

  return validMemberIds;
};

export const createRoom = async (
  input: { name: string; type: "private" | "group"; memberIds: string[] },
  creatorId: string,
): Promise<RoomResponse> => {
  const memberIds = Array.from(new Set([...input.memberIds, creatorId]));
  const members = await ensureUsersExist(memberIds);

  const room = await RoomModel.create({
    name: input.name.trim(),
    type: input.type,
    members,
    lastMessage: null,
  });

  const populatedRoom = await RoomModel.findById(room.id)
    .populate("members", "username email avatar")
    .lean();
  if (!populatedRoom) {
    throw new ApiError(500, "ROOM_CREATE_FAILED", "Không thể tạo phòng chat");
  }

  return formatRoom(
    populatedRoom as unknown as Parameters<typeof formatRoom>[0],
  );
};

export const listRoomsForUser = async (
  userId: string,
): Promise<RoomResponse[]> => {
  const rooms = await RoomModel.find({ members: userId })
    .populate("members", "username email avatar")
    .sort({ updatedAt: -1 })
    .lean();

  return rooms.map((room) =>
    formatRoom(room as unknown as Parameters<typeof formatRoom>[0]),
  );
};

export const getRoomById = async (
  roomId: string,
  userId: string,
): Promise<RoomResponse> => {
  if (!isValidObjectId(roomId)) {
    throw new ApiError(400, "INVALID_ROOM_ID", "Room id không hợp lệ");
  }

  const room = await RoomModel.findOne({ _id: roomId, members: userId })
    .populate("members", "username email avatar")
    .lean();

  if (!room) {
    throw new ApiError(
      404,
      "ROOM_NOT_FOUND",
      "Phòng chat không tồn tại hoặc bạn không có quyền truy cập",
    );
  }

  return formatRoom(room as unknown as Parameters<typeof formatRoom>[0]);
};

export const addMembersToRoom = async (
  roomId: string,
  userId: string,
  memberIds: string[],
): Promise<RoomResponse> => {
  if (!isValidObjectId(roomId)) {
    throw new ApiError(400, "INVALID_ROOM_ID", "Room id không hợp lệ");
  }

  const room = await RoomModel.findById(roomId);
  if (!room) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "Phòng chat không tồn tại");
  }

  if (!room.members.some((member) => member.toString() === userId)) {
    throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền thêm thành viên");
  }

  const newMembers = await ensureUsersExist(memberIds);
  room.members = Array.from(
    new Set([
      ...room.members.map((member) => member.toString()),
      ...newMembers.map((member) => member.toString()),
    ]),
  ).map((memberId) => new Types.ObjectId(memberId));
  await room.save();

  const populatedRoom = await RoomModel.findById(room.id)
    .populate("members", "username email avatar")
    .lean();
  if (!populatedRoom) {
    throw new ApiError(
      500,
      "ROOM_UPDATE_FAILED",
      "Không thể cập nhật phòng chat",
    );
  }

  return formatRoom(
    populatedRoom as unknown as Parameters<typeof formatRoom>[0],
  );
};

export const assertRoomMembership = async (
  roomId: string,
  userId: string,
): Promise<void> => {
  const room = await RoomModel.findOne({ _id: roomId, members: userId })
    .select("_id")
    .lean();
  if (!room) {
    throw new ApiError(403, "FORBIDDEN", "Bạn không thuộc phòng chat này");
  }
};

export const getRoomEntity = async (
  roomId: string,
): Promise<{ id: string; memberIds: string[] } | null> => {
  const room = await RoomModel.findById(roomId).select("_id members").lean();
  if (!room) {
    return null;
  }

  return {
    id: room._id.toString(),
    memberIds: room.members.map((member) => member.toString()),
  };
};
