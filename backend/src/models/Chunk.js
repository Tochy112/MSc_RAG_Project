import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    documentTitle: { type: String, required: true },
    category: { type: String },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    // Qdrant point id (uuid) — same value used as the primary key on the vector point
    vectorId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

chunkSchema.index({ text: "text" });

export const ChunkModel = mongoose.model("Chunk", chunkSchema);
