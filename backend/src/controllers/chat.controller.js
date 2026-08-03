import { hybridRetrieve } from "../services/retrieval.service.js";
import { generateAnswer } from "../services/llm.service.js";
import { ChatLogModel } from "../models/ChatLog.js";

export async function askQuestion(req, res) {
  const startedAt = Date.now();
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    const retrievedChunks = await hybridRetrieve(query);

    if (retrievedChunks.length === 0) {
      const answer =
        "I couldn't find anything in the knowledge base relevant to that question yet. Try uploading a document that covers it, or rephrase the question.";
      await ChatLogModel.create({
        query,
        answer,
        retrievedChunks: [],
        latencyMs: Date.now() - startedAt,
      });
      return res.json({ answer, sources: [] });
    }

    const answer = await generateAnswer(query, retrievedChunks);

    const chatLog = await ChatLogModel.create({
      query,
      answer,
      retrievedChunks: retrievedChunks.map((c) => ({
        chunkId: c.chunkId,
        documentTitle: c.documentTitle,
        text: c.text,
        bm25Rank: c.bm25Rank,
        denseRank: c.denseRank,
        rrfScore: c.rrfScore,
      })),
      latencyMs: Date.now() - startedAt,
    });

    res.json({
      answer,
      sources: retrievedChunks.map((c) => ({
        documentTitle: c.documentTitle,
        text: c.text,
        bm25Rank: c.bm25Rank,
        denseRank: c.denseRank,
        rrfScore: c.rrfScore,
      })),
      chatLogId: chatLog._id,
      latencyMs: chatLog.latencyMs,
    });
  } catch (err) {
    console.error("[askQuestion]", err);
    res.status(500).json({ error: "Failed to answer query", details: err.message });
  }
}

export async function listChatHistory(req, res) {
  const logs = await ChatLogModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
  res.json(logs);
}
