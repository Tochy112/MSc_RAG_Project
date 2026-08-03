import { v4 as uuidv4 } from "uuid";
import { DocumentModel } from "../models/Document.js";
import { ChunkModel } from "../models/Chunk.js";
import { chunkText } from "./chunking.service.js";
import { embedText } from "./llm.service.js";
import { upsertVector } from "./vectorStore.service.js";
import { bm25Index } from "./bm25.service.js";

/**
 * Full ingestion pipeline for one uploaded document:
 * Document text -> recursive chunking -> per-chunk embedding ->
 * Qdrant upsert -> Mongo chunk record -> BM25 index update.
 */
export async function ingestDocument({ title, category, rawText, sourceFilename }) {
  const document = await DocumentModel.create({
    title,
    category,
    rawText,
    sourceFilename,
  });

  const chunks = await chunkText(rawText);

  const chunkDocs = [];
  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i];
    const vectorId = uuidv4();
    const embedding = await embedText(text);

    const chunkDoc = await ChunkModel.create({
      documentId: document._id,
      documentTitle: document.title,
      category: document.category,
      chunkIndex: i,
      text,
      vectorId,
    });

    await upsertVector({
      vectorId,
      embedding,
      chunkId: String(chunkDoc._id),
      documentTitle: document.title,
      category: document.category,
      text,
    });

    bm25Index.addDocument(String(chunkDoc._id), text);
    chunkDocs.push(chunkDoc);
  }

  document.chunkCount = chunkDocs.length;
  await document.save();

  return { document, chunkCount: chunkDocs.length };
}

/**
 * Rebuilds the in-memory BM25 index from every chunk stored in MongoDB.
 * Called once on server startup so BM25 search works immediately after a
 * restart without re-embedding anything.
 */
export async function rebuildBM25FromMongo() {
  bm25Index.reset();
  const cursor = ChunkModel.find({}, { text: 1 }).cursor();
  let count = 0;
  for await (const chunk of cursor) {
    bm25Index.addDocument(String(chunk._id), chunk.text);
    count++;
  }
  console.log(`[bm25] rebuilt index with ${count} chunks`);
}
