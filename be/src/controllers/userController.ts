import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  getMe,
  getUserById,
  searchUsers,
  listUsers,
} from "../services/userService";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ");

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const user = await getMe(req.user.id);
  res.status(200).json({ data: user });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const userId = objectIdSchema.parse(req.params.id);
  const user = await getUserById(userId);

  res.status(200).json({ data: user });
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = z
    .string()
    .default("")
    .parse((req.query.q ?? "").toString());
  const users = await searchUsers(query);

  res.status(200).json({ data: users });
});

export const getList = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(req.query.limit) || 20)),
  );

  const users = await listUsers(req.user.id, page, limit);

  res.status(200).json({ data: users });
});
