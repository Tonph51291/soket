import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "HTTP_RATE_LIMITED",
      message: "Bạn đã gửi quá nhiều request, vui lòng thử lại sau.",
    },
  },
});
