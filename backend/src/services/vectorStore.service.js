import { qdrant, COLLECTION_NAME } from "../config/qdrant.js";

/**
 * Upserts a single chunk's embedding into Qdrant, with enough payload to
 * reconstruct the chunk without a second Mongo round-trip if needed.
 */
export async function upsertVector({ vectorId, embedding, chunkId, documentTitle, category, text }) {
  await qdrant.upsert(COLLECTION_NAME, {
    points: [
      {
        id: vectorId,
        vector: embedding,
        payload: { chunkId, documentTitle, category, text },
      },
    ],
  });
}

/**
 * Dense semantic search against Qdrant. Returns top-K
 * { vectorId, chunkId, score } sorted descending by cosine similarity.
 */
export async function searchVectors(queryEmbedding, topK = 8) {
  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
  });

  return results.map((r) => ({
    vectorId: String(r.id),
    chunkId: r.payload?.chunkId,
    score: r.score,
  }));
}

export async function deleteVector(vectorId) {
  await qdrant.delete(COLLECTION_NAME, { points: [vectorId] });
}
