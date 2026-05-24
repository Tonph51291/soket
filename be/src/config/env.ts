import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Môi trường chạy app: development | test | production (mặc định: development)
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Cổng server lắng nghe (phải là số nguyên dương, mặc định: 4000)
  PORT: z.coerce.number().int().positive().default(4000),

  // Địa chỉ kết nối MongoDB (mặc định: chạy local, database tên "chatapp")
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/chat-app"),

  // Địa chỉ kết nối Redis (mặc định: chạy local cổng 6379)
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  // Khóa bí mật để ký Access Token — KHÔNG được để lộ ra ngoài
  JWT_ACCESS_SECRET: z
    .string()
    .min(1)
    .default("a7f3c9e2b8d4f1a6c3e5b9d2f8a4c7e1b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5"),

  // Khóa bí mật để ký Refresh Token — phải KHÁC với Access Secret
  JWT_REFRESH_SECRET: z
    .string()
    .min(1)
    .default("r9b2e5h8k1n4q7t0w3z6c9f2i5l8o1r4u7x0a3d6g9j2m5p8s1v4y7b0e3h6k9"),

  // Thời gian sống của Access Token (mặc định: 15 phút — ngắn để bảo mật)
  ACCESS_TOKEN_TTL: z.string().default("15m"),

  // Thời gian sống của Refresh Token (mặc định: 7 ngày — dùng để cấp lại Access Token)
  REFRESH_TOKEN_TTL: z.string().default("7d"),

  // Domain được phép gọi API qua CORS ("*" = cho phép tất cả, nên giới hạn khi production)
  CLIENT_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);
