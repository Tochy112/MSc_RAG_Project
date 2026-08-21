# RAG Assistant

A domain-specific Retrieval-Augmented Generation assistant knowledge management, built for my MSc dissertation "Design and Evaluation of
a Retrieval-Augmented AI Assistant for Knowledge Management and Technical
Workflows: A Case Study in Interior Design".

## Architecture

- **Frontend**: React (Vite)
- **Backend**: Node.js / Express + LangChain orchestration
- **Retrieval**: Hybrid — BM25 (sparse, in-memory) + Qdrant (dense vector search),
  fused with Reciprocal Rank Fusion (RRF)
- **LLM + Embeddings**: Google Gemini (`gemini-3.6-flash` for generation,
  `gemini-embedding-001` for embeddings)
- **Chunking**: LangChain `RecursiveCharacterTextSplitter`
- **App data store**: MongoDB (documents, chunks, chat/evaluation logs)
- **Vector store**: Qdrant

## Project layout

```
tochy-rag-assistant/
├── docker-compose.yml
├── backend/          
└── frontend/         
```

## Running it

1. Copy `.env.example` to `.env` in the repo root and set `GEMINI_API_KEY`
   (get one from https://aistudio.google.com/apikey).
2. From the repo root:
   ```
   docker compose up --build
   ```
3. Services:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - Qdrant dashboard: http://localhost:6333/dashboard
   - MongoDB: localhost:27017

## Core flow

1. Upload a document (pricing sheet, quotation template, measurement guide, etc.)
   via the frontend or `POST /api/documents/upload`.
2. Backend chunks it (`RecursiveCharacterTextSplitter`), embeds each chunk
   (Gemini `gemini-embedding-001`), stores vectors in Qdrant, and indexes the raw
   text in an in-memory BM25 index (rebuilt from Mongo on startup).
3. A chat query hits `POST /api/chat` → backend runs BM25 search and Qdrant
   dense search in parallel → fuses rankings with Reciprocal Rank Fusion (RRF)
   → builds a grounded prompt from the top fused chunks → calls Gemini →
   returns the answer + the source chunks used (for citation / evaluation).
4. Every query + retrieved chunks + answer is logged to MongoDB, which is the
   raw data your Precision@K / Recall@K / MRR evaluation script will read from.

## Retriever Ablation

Run the same ground-truth query set through BM25-only, dense-only, and
hybrid+RRF at the same final K:

```
docker compose up -d --build backend
```

```
docker compose exec backend npm run eval:retrieval -- --input=eval/ground-truth.example.json --k=5
```

The input file is a JSON array of `{ "query": "...", "relevantChunkIds": [...] }`.

If relevant chunk ids have already been labelled in `ChatLog.evaluation`, run:

```
docker compose exec backend npm run eval:retrieval -- --source=chatlogs --k=5
```
