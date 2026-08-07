import "dotenv/config";
import fs from "node:fs/promises";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { ensureCollection } from "../config/qdrant.js";
import { ChatLogModel } from "../models/ChatLog.js";
import { rebuildBM25FromMongo } from "../services/ingestion.service.js";
import { compareRetrievalModes } from "../services/retrieval.service.js";

const DEFAULT_TOP_K = Number(process.env.EVAL_TOP_K || process.env.TOP_K_FUSED || 5);
const DEFAULT_INPUT = "eval/ground-truth.example.json";

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function normalizeId(id) {
  return String(id);
}

function calculateMetrics(results, relevantChunkIds, topK) {
  const relevant = new Set(relevantChunkIds.map(normalizeId));
  const retrievedIds = results.slice(0, topK).map((result) => normalizeId(result.chunkId));
  const hits = retrievedIds.filter((chunkId) => relevant.has(chunkId));
  const firstRelevantIndex = retrievedIds.findIndex((chunkId) => relevant.has(chunkId));

  return {
    precisionAtK: hits.length / topK,
    recallAtK: relevant.size === 0 ? 0 : hits.length / relevant.size,
    mrr: firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1),
    hits: hits.length,
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  return Number(value).toFixed(3);
}

async function loadQuerySet(path) {
  const raw = await fs.readFile(path, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("Ground-truth file must be a JSON array.");
  }

  return data.map((item, index) => {
    if (!item.query || !Array.isArray(item.relevantChunkIds)) {
      throw new Error(
        `Ground-truth item ${index + 1} must include query and relevantChunkIds.`,
      );
    }

    return {
      query: item.query,
      relevantChunkIds: item.relevantChunkIds,
    };
  });
}

async function loadQuerySetFromChatLogs() {
  const logs = await ChatLogModel.find({
    "evaluation.relevantChunkIds.0": { $exists: true },
  })
    .sort({ createdAt: 1 })
    .lean();

  return logs.map((log) => ({
    query: log.query,
    relevantChunkIds: log.evaluation.relevantChunkIds,
  }));
}

function printSummary(rows, modes) {
  console.log("\nRetriever ablation summary");
  console.table(
    modes.map((mode) => ({
      mode,
      "Precision@K": formatNumber(average(rows.map((row) => row[mode].precisionAtK))),
      "Recall@K": formatNumber(average(rows.map((row) => row[mode].recallAtK))),
      MRR: formatNumber(average(rows.map((row) => row[mode].mrr))),
    })),
  );
}

function printPerQuery(rows, modes) {
  console.log("\nPer-query results");
  console.table(
    rows.flatMap((row) =>
      modes.map((mode) => ({
        query: row.query,
        mode,
        hits: row[mode].hits,
        "Precision@K": formatNumber(row[mode].precisionAtK),
        "Recall@K": formatNumber(row[mode].recallAtK),
        MRR: formatNumber(row[mode].mrr),
      })),
    ),
  );
}

async function main() {
  const inputPath = getArg("input", DEFAULT_INPUT);
  const topK = Number(getArg("k", DEFAULT_TOP_K));
  const source = getArg("source", "file");

  if (!Number.isInteger(topK) || topK < 1 || topK > 50) {
    throw new Error("--k must be an integer between 1 and 50.");
  }

  const modes = ["bm25", "dense", "hybrid"];

  await connectDB();
  await ensureCollection();
  await rebuildBM25FromMongo();

  const querySet =
    source === "chatlogs"
      ? await loadQuerySetFromChatLogs()
      : await loadQuerySet(inputPath);

  if (querySet.length === 0) {
    throw new Error("No evaluation queries found.");
  }

  const rows = [];
  for (const item of querySet) {
    const comparison = await compareRetrievalModes(item.query, topK);
    const row = { query: item.query };

    for (const mode of modes) {
      row[mode] = calculateMetrics(
        comparison[mode],
        item.relevantChunkIds,
        topK,
      );
    }

    rows.push(row);
  }

  printSummary(rows, modes);
  printPerQuery(rows, modes);
}

main()
  .catch((err) => {
    console.error("[retrieverAblation]", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
