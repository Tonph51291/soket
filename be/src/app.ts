import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";
import { roomRoutes } from "./routes/roomRoutes";
import { messageRoutes } from "./routes/messageRoutes";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler";
import { env } from "./config/env";

const createCorsOrigin = (): boolean | string | string[] => {
  if (env.CLIENT_ORIGIN.trim() === "*") {
    return true;
  }

  if (env.CLIENT_ORIGIN.includes(",")) {
    return env.CLIENT_ORIGIN.split(",").map((origin: string) => origin.trim());
  }

  return env.CLIENT_ORIGIN;
};

export const app = express();

app.use(helmet());
app.use(cors({ origin: createCorsOrigin(), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api", messageRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);
