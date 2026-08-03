import { Router } from "express";
import multer from "multer";
import { uploadDocument, listDocuments, deleteDocument } from "../controllers/documents.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.delete("/:id", deleteDocument);

export default router;
