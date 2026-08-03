import { getAuthToken } from "./auth.js";

const BASE = "/api";

function authHeaders(headers = {}) {
  const token = getAuthToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

async function handleResponse(res, fallbackMessage) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || fallbackMessage);
  }
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE}/documents`, {
    headers: authHeaders(),
  });
  return handleResponse(res, "Failed to list documents");
}

export async function uploadDocument({ title, category, rawText, file }) {
  let res;
  const headers = authHeaders();

  if (file) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("file", file);
    res = await fetch(`${BASE}/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
  } else {
    res = await fetch(`${BASE}/documents/upload`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ title, category, rawText }),
    });
  }

  return handleResponse(res, "Upload failed");
}

export async function deleteDocument(id) {
  const res = await fetch(`${BASE}/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res, "Delete failed");
}

export async function askQuestion(query) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query }),
  });
  return handleResponse(res, "Query failed");
}

export async function getAdminStats() {
  const res = await fetch(`${BASE}/admin/stats`, {
    headers: authHeaders(),
  });
  return handleResponse(res, "Failed to load admin stats");
}
