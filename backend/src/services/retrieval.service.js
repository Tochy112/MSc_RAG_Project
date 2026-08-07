import { ChunkModel } from "../models/Chunk.js";
import { bm25Index } from "./bm25.service.js";
import { searchVectors } from "./vectorStore.service.js";
import { embedText } from "./llm.service.js";

const TOP_K_BM25 = Number(process.env.TOP_K_BM25 || 8);
const TOP_K_DENSE = Number(process.env.TOP_K_DENSE || 8);
const TOP_K_FUSED = Number(process.env.TOP_K_FUSED || 5);
const RRF_K = Number(process.env.RRF_K || 60);

// Reciprocal Rank Fusion.
export function reciprocalRankFusion(rankedLists, rrfK = RRF_K) {
  const fused = new Map(); // chunkId -> { score, ranks: {source: rank} }

  for (const { source, results } of rankedLists) {
    results.forEach((item, index) => {
      const rank = index + 1;
      const contribution = 1 / (rrfK + rank);
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

async function hydrateResults(results) {
  const chunkIds = results.map((result) => result.chunkId);
  const chunks = await ChunkModel.find({ _id: { $in: chunkIds } }).lean();
  const chunkById = new Map(chunks.map((chunk) => [String(chunk._id), chunk]));

  return results
    .map((result) => {
      const chunk = chunkById.get(String(result.chunkId));
      if (!chunk) return null;
      return {
        chunkId: chunk._id,
        documentTitle: chunk.documentTitle,
        text: chunk.text,
        bm25Rank: result.ranks?.bm25 ?? null,
        denseRank: result.ranks?.dense ?? null,
        bm25Score: result.bm25Score ?? null,
        denseScore: result.denseScore ?? null,
        rrfScore: result.score ?? null,
      };
    })
    .filter(Boolean);
}

export async function bm25Retrieve(query, topK = TOP_K_BM25) {
  const results = bm25Index.search(query, topK).map((result, index) => ({
    chunkId: result.chunkId,
    bm25Score: result.score,
    ranks: { bm25: index + 1 },
  }));

  return hydrateResults(results);
}

export async function denseRetrieve(query, topK = TOP_K_DENSE) {
  const queryEmbedding = await embedText(query);
  const results = (await searchVectors(queryEmbedding, topK)).map((result, index) => ({
    chunkId: result.chunkId,
    denseScore: result.score,
    ranks: { dense: index + 1 },
  }));

  return hydrateResults(results);
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
export async function hybridRetrieve(
  query,
  {
    topK = TOP_K_FUSED,
    bm25K = TOP_K_BM25,
    denseK = TOP_K_DENSE,
    rrfK = RRF_K,
  } = {},
) {
  const queryEmbedding = await embedText(query);

  const bm25Results = bm25Index
    .search(query, bm25K)
    .map((r) => ({ chunkId: r.chunkId }));

  const denseRaw = await searchVectors(queryEmbedding, denseK);
  const denseResults = denseRaw.map((r) => ({ chunkId: r.chunkId }));

  const fused = reciprocalRankFusion([
    { source: "bm25", results: bm25Results },
    { source: "dense", results: denseResults },
  ], rrfK).slice(0, topK);

  return hydrateResults(fused);
}

export async function compareRetrievalModes(query, topK = TOP_K_FUSED) {
  const queryEmbedding = await embedText(query);

  const bm25Raw = bm25Index.search(query, topK);
  const denseRaw = await searchVectors(queryEmbedding, topK);

  const bm25Ranked = bm25Raw.map((result, index) => ({
    chunkId: result.chunkId,
    bm25Score: result.score,
    ranks: { bm25: index + 1 },
  }));

  const denseRanked = denseRaw.map((result, index) => ({
    chunkId: result.chunkId,
    denseScore: result.score,
    ranks: { dense: index + 1 },
  }));

  const hybridRanked = reciprocalRankFusion([
    { source: "bm25", results: bm25Ranked },
    { source: "dense", results: denseRanked },
  ]).slice(0, topK);

  const [bm25, dense, hybrid] = await Promise.all([
    hydrateResults(bm25Ranked),
    hydrateResults(denseRanked),
    hydrateResults(hybridRanked),
  ]);

  return { topK, bm25, dense, hybrid };
}
