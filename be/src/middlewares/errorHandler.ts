import type { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { ApiError } from "../utils/ApiError";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(
    new ApiError(
      404,
      "NOT_FOUND",
      `Không tìm thấy route ${req.method} ${req.originalUrl}`,
    ),
  );
};

export const globalErrorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  if (error instanceof MongooseError.CastError) {
    res.status(400).json({
      error: {
        code: "INVALID_ID",
        message: "Dữ liệu định danh không hợp lệ",
      },
    });
    return;
  }

  if (error instanceof MongooseError.ValidationError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu không hợp lệ",
        details: Object.values(error.errors).map((item) => item.message),
      },
    });
    return;
  }

  if (error instanceof Error && /E11000/.test(error.message)) {
    res.status(409).json({
      error: {
        code: "DUPLICATE_KEY",
        message: "Dữ liệu đã tồn tại",
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Đã xảy ra lỗi không mong muốn",
    },
  });
};
