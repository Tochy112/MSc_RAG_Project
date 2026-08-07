import React from "react";
import { Bot } from "lucide-react";
import SourceTag from "./SourceTag.jsx";

function cleanMath(text) {
  return text
    .replace(/\$([^$]+)\$/g, (_, expression) =>
      expression
        .replace(/\\mathbf\{([^{}]+)\}/g, "$1")
        .replace(/\\text\{([^{}]+)\}/g, "$1")
        .replace(/\\times/g, "x")
        .replace(/\\/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(");
}

function cleanMarkdown(text) {
  return cleanMath(text)
    .replace(/([A-Za-z][^:\n]{0,60}:)\*/g, "**$1**")
    .replace(/\*([.,;:)])/g, "$1")
    .replace(/([A-Za-z0-9)])\*(\s|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function renderInline(text) {
  const cleaned = cleanMarkdown(text);
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

function renderMarkdown(content) {
  const lines = content.split("\n");
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul className="msg-list" key={`list-${blocks.length}`}>
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushList();
      blocks.push(<hr className="msg-divider" key={`hr-${index}`} />);
      return;
    }

    if (trimmed.startsWith("### ") || /^\d+\.\s+\S/.test(trimmed)) {
      flushList();
      const heading = trimmed.replace(/^#{1,6}\s+/, "").replace(/^\d+\.\s+/, "");
      blocks.push(
        <h3 className="msg-heading" key={`heading-${index}`}>
          {renderInline(heading)}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();
    blocks.push(
      <p className="msg-paragraph" key={`paragraph-${index}`}>
        {renderInline(trimmed)}
      </p>,
    );
  });

  flushList();
  return blocks;
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div className="msg-avatar">
        {isUser ? "You" : <Bot size={17} aria-label="Agent" />}
      </div>
      <div style={{ maxWidth: "100%" }}>
        <div className="msg-bubble">
          {message.pending ? (
            <span className="pending-dot">
              <span />
              <span />
              <span />
            </span>
          ) : (
            <div className="msg-markdown">{renderMarkdown(message.content)}</div>
          )}
        </div>
        {/* {!isUser && message.sources && message.sources.length > 0 && (
          <div className="sources">
            {message.sources.map((s, i) => (
              <SourceTag source={s} key={i} />
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
}
