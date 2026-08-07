import { DocumentModel } from "../models/Document.js";
import { ChunkModel } from "../models/Chunk.js";
import { ChatLogModel } from "../models/ChatLog.js";
import { compareRetrievalModes } from "../services/retrieval.service.js";

export async function getAdminStats(req, res) {
  try {
    const totalDocuments = await DocumentModel.countDocuments();
    const totalChunks = await ChunkModel.countDocuments();
    const totalChats = await ChatLogModel.countDocuments();
    const recentUploads = await DocumentModel.find({}, { rawText: 0 })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({ totalDocuments, totalChunks, totalChats, recentUploads });
  } catch (err) {
    console.error("[getAdminStats]", err);
    res.status(500).json({ error: "Unable to read admin stats" });
  }
}

export async function compareRetrieval(req, res) {
  try {
    const { query } = req.body;
    const topK = Number(req.body.topK || req.query.topK || process.env.TOP_K_FUSED || 5);

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    if (!Number.isInteger(topK) || topK < 1 || topK > 50) {
      return res.status(400).json({ error: "topK must be an integer between 1 and 50" });
    }

    const results = await compareRetrievalModes(query, topK);
    res.json({ query, ...results });
  } catch (err) {
    console.error("[compareRetrieval]", err);
    res.status(500).json({ error: "Unable to compare retrieval modes" });
  }
}
