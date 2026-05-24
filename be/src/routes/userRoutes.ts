import { Router } from "express";
import { getById, me, search } from "../controllers/userController";
import { authenticateHttp } from "../middlewares/auth";

export const userRoutes = Router();

userRoutes.get("/me", authenticateHttp, me);
userRoutes.get("/search", authenticateHttp, search);
userRoutes.get("/:id", authenticateHttp, getById);
