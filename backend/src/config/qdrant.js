import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
export const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "tochy_chunks";

// Gemini text-embedding-004 produces 768-dim vectors.
const EMBEDDING_DIM = 768;

export const qdrant = new QdrantClient({ url: QDRANT_URL });

export async function ensureCollection() {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: EMBEDDING_DIM,
        distance: "Cosine",
      },
    });
    console.log(`[qdrant] created collection "${COLLECTION_NAME}"`);
  } else {
    console.log(`[qdrant] using existing collection "${COLLECTION_NAME}"`);
  }
}
