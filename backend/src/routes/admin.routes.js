import { Router } from "express";
import { compareRetrieval, getAdminStats } from "../controllers/admin.controller.js";

const router = Router();

router.get("/stats", getAdminStats);
router.post("/retrieval/compare", compareRetrieval);

export default router;
