import React, { useState } from "react";

export default function AuthForm({ mode, onSubmit, error, loading, onSwitchMode }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ username, password });
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>{isSignup ? "Create Staff Account" : "Sign In"}</h1>
        <p>{isSignup ? "Register staff to use the chat assistant." : "Sign in as admin or staff."}</p>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Working…" : isSignup ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="auth-switch">
          {isSignup ? (
            <>
              Already have an account? <button type="button" onClick={() => onSwitchMode("login")}>Sign In</button>
            </>
          ) : (
            <>
              Need staff access? <button type="button" onClick={() => onSwitchMode("signup")}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
