import { Router } from "express";
import { history } from "../controllers/messageController";
import { authenticateHttp } from "../middlewares/auth";

export const messageRoutes = Router();

messageRoutes.get("/rooms/:id/messages", authenticateHttp, history);
