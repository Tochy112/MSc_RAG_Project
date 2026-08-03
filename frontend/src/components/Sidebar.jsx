import React, { useState } from "react";

const CATEGORIES = [
  { value: "pricing_sheet", label: "Pricing sheet" },
  { value: "quotation_template", label: "Quotation template" },
  { value: "measurement_guide", label: "Measurement guide" },
  { value: "product_catalogue", label: "Product catalogue" },
  { value: "operational_procedure", label: "Operational procedure" },
  { value: "other", label: "Other" },
];

export default function Sidebar({ documents, onUpload, onDelete, uploading }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("pricing_sheet");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || (!rawText && !file)) return;
    await onUpload({ title, category, rawText, file });
    setTitle("");
    setRawText("");
    setFile(null);
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">Tochy</span>
        <span className="brand-sub">Knowledge Assistant</span>
      </div>

      <div>
        <div className="sidebar-section-label">Add to knowledge base</div>
        <form className="upload-card" onSubmit={handleSubmit}>
          <input
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Paste text, or attach a file below"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <input
            type="file"
            accept=".txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button className="btn-primary" type="submit" disabled={uploading}>
            {uploading ? "Indexing…" : "Ingest document"}
          </button>
        </form>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="sidebar-section-label">
          Knowledge base ({documents.length})
        </div>
        <div className="doc-list">
          {documents.map((doc) => (
            <div className="doc-chip" key={doc._id}>
              <div>
                <div className="doc-chip-title">{doc.title}</div>
                <div className="doc-chip-meta">
                  {doc.category.replace(/_/g, " ")} · {doc.chunkCount} chunks
                </div>
              </div>
              <button onClick={() => onDelete(doc._id)} title="Remove">
                ✕
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="doc-chip-meta" style={{ padding: "6px 2px" }}>
              No documents yet — add a pricing sheet or quotation template to
              get started.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
