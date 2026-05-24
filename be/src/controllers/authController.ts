import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  loginUser,
  logoutUser,
  refreshUserTokens,
  registerUser,
} from "../services/authService";

const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  email: z.string().trim().email(),
  password: z.string().min(8),
  avatar: z.string().trim().url().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const tokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);

  res.status(201).json({ data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);

  res.status(200).json({ data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const payload = tokenSchema.parse(req.body);
  const result = await refreshUserTokens(payload.refreshToken);

  res.status(200).json({ data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const payload = tokenSchema.parse(req.body);
  await logoutUser(payload.refreshToken);

  res.status(204).send();
});

export const authControllerSchemas = {
  registerSchema,
  loginSchema,
  tokenSchema,
};
