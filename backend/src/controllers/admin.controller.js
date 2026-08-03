import { DocumentModel } from "../models/Document.js";
import { ChunkModel } from "../models/Chunk.js";
import { ChatLogModel } from "../models/ChatLog.js";

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
