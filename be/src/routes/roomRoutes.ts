import { Router } from "express";
import {
  addMembers,
  create,
  detail,
  list,
} from "../controllers/roomController";
import { authenticateHttp } from "../middlewares/auth";

export const roomRoutes = Router();

roomRoutes.post("/", authenticateHttp, create);
roomRoutes.get("/", authenticateHttp, list);
roomRoutes.get("/:id", authenticateHttp, detail);
roomRoutes.post("/:id/members", authenticateHttp, addMembers);
