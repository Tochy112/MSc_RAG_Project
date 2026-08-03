import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-1.5-flash";
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

/**
 * Embeds a single piece of text into a dense vector using Gemini's
 * text-embedding-004 model (768 dimensions).
 */
export async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Embeds many chunks. Done sequentially in small batches to stay well
 * within free-tier rate limits; swap for embedBatch API if you upgrade.
 */
export async function embedTexts(texts) {
  const vectors = [];
  for (const text of texts) {
    const vector = await embedText(text);
    vectors.push(vector);
  }
  return vectors;
}

/**
 * Builds a grounded prompt from the fused, retrieved chunks and calls
 * Gemini for the final answer. This is the "response generation" step
 * of the RAG pipeline (Chapter 3, Section B / C).
 */
export async function generateAnswer(query, contextChunks) {
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

  const contextBlock = contextChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1} — ${chunk.documentTitle}]\n${chunk.text}`
    )
    .join("\n\n");

  const prompt = `You are a knowledge assistant for an interior design company. Answer the user's question using ONLY the context provided below. If the context does not contain enough information to answer confidently, say so clearly instead of guessing.

CONTEXT:
${contextBlock}

QUESTION:
${query}

Answer concisely and, where relevant, cite which source(s) you used (e.g. "Source 2").`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
