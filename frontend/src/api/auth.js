const BASE = "/api/auth";
const TOKEN_KEY = "rag_auth_token";
const ROLE_KEY = "rag_auth_role";
const USERNAME_KEY = "rag_auth_username";

async function handleResponse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Authentication failed");
  }
  return body;
}

export async function login({ username, password }) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function signup({ username, password }) {
  const res = await fetch(`${BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthData({ token, role, username }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USERNAME_KEY, username || "");
}

export function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  const username = localStorage.getItem(USERNAME_KEY);
  if (!token || !role) return null;
  return { token, role, username };
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USERNAME_KEY);
}
