import { Router } from "express";
import { getById, me, search, getList } from "../controllers/userController";
import { authenticateHttp } from "../middlewares/auth";

export const userRoutes = Router();

userRoutes.get("/me", authenticateHttp, me);
userRoutes.get("/search", authenticateHttp, search);
userRoutes.get("/", authenticateHttp, getList);
userRoutes.get("/:id", authenticateHttp, getById);
