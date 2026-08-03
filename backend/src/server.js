import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { ensureCollection } from "./config/qdrant.js";
import { rebuildBM25FromMongo } from "./services/ingestion.service.js";

import healthRoutes from "./routes/health.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { ensureDefaultAdmin } from "./controllers/auth.controller.js";
import { ensureAuthenticated, ensureAdmin } from "./middleware/auth.middleware.js";

const PORT = process.env.PORT || 4000;

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/documents", ensureAuthenticated, ensureAdmin, documentsRoutes);
  app.use("/api/chat", ensureAuthenticated, chatRoutes);
  app.use("/api/admin", ensureAuthenticated, ensureAdmin, adminRoutes);

  app.use((err, req, res, next) => {
    console.error("[unhandled]", err);
    res.status(500).json({ error: "Internal server error" });
  });

  await connectDB();
  await ensureDefaultAdmin();
  await ensureCollection();
  await rebuildBM25FromMongo();

  app.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("[startup] fatal error:", err);
  process.exit(1);
});
