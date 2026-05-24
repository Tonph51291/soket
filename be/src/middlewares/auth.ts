import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

export const authenticateHttp = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "UNAUTHORIZED", "Thiếu access token"));
    return;
  }

  const token = authorization.slice(7).trim();
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(
      new ApiError(
        401,
        "UNAUTHORIZED",
        "Access token không hợp lệ hoặc đã hết hạn",
      ),
    );
  }
};
