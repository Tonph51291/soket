import { Router } from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController";
import { authRateLimit } from "../middlewares/rateLimit";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimit, register);
authRoutes.post("/login", authRateLimit, login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);
