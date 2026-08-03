import React from "react";
import SourceTag from "./SourceTag.jsx";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div className="msg-avatar">{isUser ? "You" : "AI"}</div>
      <div style={{ maxWidth: "100%" }}>
        <div className="msg-bubble">
          {message.pending ? (
            <span className="pending-dot">
              <span />
              <span />
              <span />
            </span>
          ) : (
            message.content
          )}
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="sources">
            {message.sources.map((s, i) => (
              <SourceTag source={s} key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
