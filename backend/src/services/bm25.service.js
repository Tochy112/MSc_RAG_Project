const K1 = 1.5;
const B = 0.75;

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

class BM25Index {
  constructor() {
    this.docs = new Map();
    this.postings = new Map();
    this.avgDocLength = 0;
  }

  reset() {
    this.docs.clear();
    this.postings.clear();
    this.avgDocLength = 0;
  }

  addDocument(chunkId, text) {
    const tokens = tokenize(text);
    this.docs.set(chunkId, { tokens, length: tokens.length });

    const seen = new Set(tokens);
    for (const term of seen) {
      if (!this.postings.has(term)) this.postings.set(term, new Set());
      this.postings.get(term).add(chunkId);
    }

    this._recomputeAvgLength();
  }

  removeDocument(chunkId) {
    if (!this.docs.has(chunkId)) return;
    this.docs.delete(chunkId);
    for (const [term, set] of this.postings.entries()) {
      set.delete(chunkId);
      if (set.size === 0) this.postings.delete(term);
    }
    this._recomputeAvgLength();
  }

  _recomputeAvgLength() {
    const lengths = [...this.docs.values()].map((d) => d.length);
    this.avgDocLength = lengths.length
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 0;
  }

  _termFrequency(tokens, term) {
    let count = 0;
    for (const t of tokens) if (t === term) count++;
    return count;
  }

  _idf(term) {
    const N = this.docs.size;
    const df = this.postings.get(term)?.size || 0;
    // BM25 IDF with 0.5 smoothing, floored at a small positive value
    return Math.log(1 + (N - df + 0.5) / (df + 0.5));
  }

  
  // Returns top-K { chunkId, score } sorted descending by BM25 score.
  search(query, topK = 8) {
    const queryTerms = [...new Set(tokenize(query))];
    const scores = new Map();

    for (const term of queryTerms) {
      const idf = this._idf(term);
      const candidateIds = this.postings.get(term);
      if (!candidateIds) continue;

      for (const chunkId of candidateIds) {
        const { tokens, length } = this.docs.get(chunkId);
        const tf = this._termFrequency(tokens, term);
        const denom = tf + K1 * (1 - B + (B * length) / (this.avgDocLength || 1));
        const score = idf * ((tf * (K1 + 1)) / denom);
        scores.set(chunkId, (scores.get(chunkId) || 0) + score);
      }
    }

    return [...scores.entries()]
      .map(([chunkId, score]) => ({ chunkId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export const bm25Index = new BM25Index();
