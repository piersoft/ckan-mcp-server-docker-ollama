import { useState } from "react";

export default function ToolCallBadge({ toolCall }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tool-badge">
      <button className="tool-badge-header" onClick={() => setOpen(!open)}>
        <span className="tool-icon">⚙</span>
        <span className="tool-name">{toolCall.tool}</span>
        <span className="tool-toggle">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <pre className="tool-args">
          {JSON.stringify(toolCall.args, null, 2)}
        </pre>
      )}
    </div>
  );
}
