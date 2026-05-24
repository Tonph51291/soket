import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  addMembersToRoom,
  createRoom,
  getRoomById,
  listRoomsForUser,
} from "../services/roomService";

const roomIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "ID phòng không hợp lệ");

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["private", "group"]).default("group"),
  memberIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const payload = createRoomSchema.parse(req.body);
  const room = await createRoom(payload, req.user.id);

  res.status(201).json({ data: room });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const rooms = await listRoomsForUser(req.user.id);
  res.status(200).json({ data: rooms });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const roomId = roomIdSchema.parse(req.params.id);
  const room = await getRoomById(roomId, req.user.id);

  res.status(200).json({ data: room });
});

export const addMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const roomId = roomIdSchema.parse(req.params.id);
  const payload = addMembersSchema.parse(req.body);
  const room = await addMembersToRoom(roomId, req.user.id, payload.memberIds);

  res.status(200).json({ data: room });
});
