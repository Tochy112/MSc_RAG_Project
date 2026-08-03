import React from "react";

export default function ProtectedView({ role, children, adminView, staffView }) {
  if (role === "admin") return children(adminView);
  if (role === "staff") return children(staffView);
  return <div className="auth-shell">Unauthorized role.</div>;
}
