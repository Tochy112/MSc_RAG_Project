import { DocumentModel } from "../models/Document.js";
import { ChunkModel } from "../models/Chunk.js";
import { ingestDocument } from "../services/ingestion.service.js";
import { deleteVector } from "../services/vectorStore.service.js";
import { bm25Index } from "../services/bm25.service.js";

export async function uploadDocument(req, res) {
  try {
    const { title, category } = req.body;
    let rawText = req.body.rawText;
    let sourceFilename = null;

    if (req.file) {
      rawText = req.file.buffer.toString("utf-8");
      sourceFilename = req.file.originalname;
    }

    if (!title || !rawText) {
      return res.status(400).json({ error: "title and rawText (or a file) are required" });
    }

    const { document, chunkCount } = await ingestDocument({
      title,
      category: category || "other",
      rawText,
      sourceFilename,
    });

    res.status(201).json({
      id: document._id,
      title: document.title,
      category: document.category,
      chunkCount,
    });
  } catch (err) {
    console.error("[uploadDocument]", err);
    res.status(500).json({ error: "Failed to ingest document", details: err.message });
  }
}

export async function listDocuments(req, res) {
  const documents = await DocumentModel.find({}, { rawText: 0 }).sort({ createdAt: -1 }).lean();
  res.json(documents);
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const chunks = await ChunkModel.find({ documentId: id }).lean();

    for (const chunk of chunks) {
      await deleteVector(chunk.vectorId);
      bm25Index.removeDocument(String(chunk._id));
    }

    await ChunkModel.deleteMany({ documentId: id });
    await DocumentModel.findByIdAndDelete(id);

    res.json({ deleted: true, chunksRemoved: chunks.length });
  } catch (err) {
    console.error("[deleteDocument]", err);
    res.status(500).json({ error: "Failed to delete document", details: err.message });
  }
}
