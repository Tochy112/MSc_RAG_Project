import { ChunkModel } from "../models/Chunk.js";
import { bm25Index } from "./bm25.service.js";
import { searchVectors } from "./vectorStore.service.js";
import { embedText } from "./llm.service.js";

const TOP_K_BM25 = Number(process.env.TOP_K_BM25 || 8);
const TOP_K_DENSE = Number(process.env.TOP_K_DENSE || 8);
const TOP_K_FUSED = Number(process.env.TOP_K_FUSED || 5);
const RRF_K = Number(process.env.RRF_K || 60);

// Reciprocal Rank Fusion.
function reciprocalRankFusion(rankedLists) {
  const fused = new Map(); // chunkId -> { score, ranks: {source: rank} }

  for (const { source, results } of rankedLists) {
    results.forEach((item, index) => {
      const rank = index + 1;
      const contribution = 1 / (RRF_K + rank);
      const existing = fused.get(item.chunkId) || { score: 0, ranks: {} };
      existing.score += contribution;
      existing.ranks[source] = rank;
      fused.set(item.chunkId, existing);
    });
  }

  return [...fused.entries()]
    .map(([chunkId, data]) => ({ chunkId, ...data }))
    .sort((a, b) => b.score - a.score);
}

/*
 Runs the full hybrid retrieval pipeline for a query:
 1. BM25 sparse search (in-memory, exact-term matching)
 2. Dense vector search via Qdrant (semantic similarity)
 3. Fuse both ranked lists with Reciprocal Rank Fusion
 4. Hydrate the top fused chunk ids with their text from MongoDB
 
  Returns the top-K fused chunks, each annotated with its rank in each
  individual ranker and its final RRF score.
 */
export async function hybridRetrieve(query) {
  const queryEmbedding = await embedText(query);

  const bm25Results = bm25Index
    .search(query, TOP_K_BM25)
    .map((r) => ({ chunkId: r.chunkId }));

  const denseRaw = await searchVectors(queryEmbedding, TOP_K_DENSE);
  const denseResults = denseRaw.map((r) => ({ chunkId: r.chunkId }));

  const fused = reciprocalRankFusion([
    { source: "bm25", results: bm25Results },
    { source: "dense", results: denseResults },
  ]).slice(0, TOP_K_FUSED);

  const chunkIds = fused.map((f) => f.chunkId);
  const chunks = await ChunkModel.find({ _id: { $in: chunkIds } }).lean();
  const chunkById = new Map(chunks.map((c) => [String(c._id), c]));

  return fused
    .map((f) => {
      const chunk = chunkById.get(String(f.chunkId));
      if (!chunk) return null;
      return {
        chunkId: chunk._id,
        documentTitle: chunk.documentTitle,
        text: chunk.text,
        bm25Rank: f.ranks.bm25 ?? null,
        denseRank: f.ranks.dense ?? null,
        rrfScore: f.score,
      };
    })
    .filter(Boolean);
}
