import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ onAsk }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const query = input.trim();
    if (!query || busy) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "", pending: true },
    ]);
    setBusy(true);

    try {
      const result = await onAsk(query);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        };
        return next;
      });
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: `Something went wrong: ${err.message}`,
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-column">
      <div className="messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="signature">Ask tochyAI.</div>
            <p>
              Try: "What's the wastage allowance for carpet calculations?" or
              "How is the curtain fabric quantity calculated for double drops?"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble message={m} key={i} />
        ))}
      </div>

      <form className="composer" onSubmit={handleSend}>
        <input
          placeholder="Ask about pricing, measurements, quotation logic…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          Send
        </button>
      </form>
    </div>
  );
}
