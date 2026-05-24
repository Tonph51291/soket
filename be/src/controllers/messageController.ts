import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { listRoomMessages } from "../services/messageService";

const roomIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "ID phòng không hợp lệ");

const querySchema = z.object({
  cursor: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Thiếu thông tin xác thực");
  }

  const roomId = roomIdSchema.parse(req.params.id);
  const query = querySchema.parse(req.query);

  const result = await listRoomMessages({
    roomId,
    userId: req.user.id,
    cursor: query.cursor,
    page: query.page,
    limit: query.limit,
  });

  res.status(200).json({ data: result });
});
