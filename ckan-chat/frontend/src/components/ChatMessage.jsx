import { useMemo } from "react";

function parseMarkdown(text) {
  return text
    // Link [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Bold **text**
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic *text*
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Inline code `code`
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // H3 ### title
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    // H2 ## title
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // Lista - item
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    // Wrap liste
    .replace(/(<li>.*<\/li>\n?)+/gs, "<ul>$&</ul>")
    // Paragrafi (doppio a capo)
    .replace(/\n\n+/g, "</p><p>")
    // Singolo a capo
    .replace(/\n/g, "<br/>");
}

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  const html = useMemo(() => {
    if (isUser) return null;
    return parseMarkdown(message.content);
  }, [message.content, isUser]);

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <div className="message-avatar">
        {isUser ? "U" : "◈"}
      </div>
      <div className="message-bubble">
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
          />
        )}
      </div>
    </div>
  );
}
