import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import AuthForm from "./components/AuthForm.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  askQuestion,
  getAdminStats,
} from "./api/client.js";
import { login, signup, getStoredAuth, clearAuthData, setAuthData } from "./api/auth.js";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [stats, setStats] = useState({ totalDocuments: 0, totalChunks: 0, totalChats: 0, recentUploads: [] });

  async function refreshDocuments() {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshStats() {
    try {
      const result = await getAdminStats();
      setStats(result);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (auth?.role === "admin") {
      refreshDocuments();
      refreshStats();
    }
  }, [auth]);

  async function handleUpload(payload) {
    setUploading(true);
    try {
      await uploadDocument(payload);
      await refreshDocuments();
      await refreshStats();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    await deleteDocument(id);
    await refreshDocuments();
    await refreshStats();
  }

  async function handleAsk(query) {
    return askQuestion(query);
  }

  async function handleAuthSubmit(credentials) {
    setAuthError("");
    try {
      const result = authMode === "login" ? await login(credentials) : await signup(credentials);
      setAuthData(result);
      setAuth(result);
    } catch (err) {
      setAuthError(err.message);
    }
  }

  function handleSwitchMode(mode) {
    setAuthMode(mode);
    setAuthError("");
  }

  function handleLogout() {
    clearAuthData();
    setAuth(null);
  }

  if (!auth) {
    return (
      <AuthForm
        mode={authMode}
        onSubmit={handleAuthSubmit}
        onSwitchMode={handleSwitchMode}
        loading={false}
        error={authError}
      />
    );
  }

  return (
    <div className="app-root">
      <div className="topbar">
        <div>
          <strong>{auth.username}</strong> • {auth.role === "admin" ? "Admin" : "Staff"}
        </div>
        <button className="btn-secondary" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
      {auth.role === "admin" ? (
        <div className="app-shell admin-view">
          <Sidebar
            documents={documents}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploading}
          />
          <div className="admin-content">
            <AdminDashboard stats={stats} />
          </div>
        </div>
      ) : (
        <div className="staff-view">
          <div className="staff-chat">
            <ChatWindow onAsk={handleAsk} />
          </div>
        </div>
      )}
    </div>
  );
}
