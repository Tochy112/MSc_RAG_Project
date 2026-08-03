import mongoose from "mongoose";

const retrievedChunkSchema = new mongoose.Schema(
  {
    chunkId: { type: mongoose.Schema.Types.ObjectId, ref: "Chunk" },
    documentTitle: String,
    text: String,
    bm25Rank: Number,
    denseRank: Number,
    rrfScore: Number,
  },
  { _id: false }
);

const chatLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true },
    answer: { type: String, required: true },
    retrievedChunks: [retrievedChunkSchema],
    // Free-slot for evaluation harness (Precision@K/Recall@K/MRR)
    evaluation: {
      relevantChunkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chunk" }],
      precisionAtK: Number,
      recallAtK: Number,
      reciprocalRank: Number,
    },
    latencyMs: { type: Number },
  },
  { timestamps: true }
);

chatLogSchema.index({ user: 1, createdAt: -1 });

export const ChatLogModel = mongoose.model("ChatLog", chatLogSchema);
