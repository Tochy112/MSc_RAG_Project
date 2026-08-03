import React from "react";

export default function SourceTag({ source }) {
  const rankLabel = [
    source.bm25Rank ? `BM25 #${source.bm25Rank}` : null,
    source.denseRank ? `Dense #${source.denseRank}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="source-tag">
      <div className="source-tag-head">
        <span className="source-tag-title">{source.documentTitle}</span>
        <span className="source-tag-rank">{rankLabel}</span>
      </div>
      <div className="source-tag-text">
        {source.text.length > 220 ? `${source.text.slice(0, 220)}…` : source.text}
      </div>
    </div>
  );
}
