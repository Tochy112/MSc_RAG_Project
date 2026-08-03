import { Router } from "express";
import { askQuestion, listChatHistory } from "../controllers/chat.controller.js";

const router = Router();

router.post("/", askQuestion);
router.get("/history", listChatHistory);

export default router;
