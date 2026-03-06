import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const MCP_URL = process.env.MCP_URL || "http://192.168.0.88:3000/mcp";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── MCP helpers ─────────────────────────────────────────────────────────────

let toolsCache = null;

async function mcpCall(method, params = {}) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: Date.now() }),
  });

  const raw = await res.text();
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (t.startsWith("data:")) {
      try { return JSON.parse(t.slice(5).trim()); } catch {}
    } else if (t.startsWith("{")) {
      try { return JSON.parse(t); } catch {}
    }
  }
  return JSON.parse(raw);
}

async function getTools() {
  if (toolsCache) return toolsCache;
  const res = await mcpCall("tools/list");
  toolsCache = res.result?.tools ?? [];
  return toolsCache;
}

function mcpToolToAnthropic(tool) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema ?? { type: "object", properties: {} },
  };
}

async function callTool(name, args) {
  const res = await mcpCall("tools/call", { name, arguments: args });
  const content = res.result?.content ?? [];
  return content.map((c) => c.text ?? JSON.stringify(c)).join("\n");
}

// ─── Anthropic chat con tool loop ─────────────────────────────────────────────

async function chatWithTools(messages, model) {
  const tools = await getTools();
  const anthropicTools = tools.map(mcpToolToAnthropic);
  const toolCallsLog = [];

  let history = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const systemPrompt = `Sei un assistente esperto di open data. Hai accesso a strumenti per interrogare portali CKAN.
Quando l'utente chiede di cercare dataset, usa SEMPRE gli strumenti disponibili per interrogare dati reali.
Il portale principale è https://www.dati.gov.it/opendata (Italia), ma puoi usare qualsiasi URL CKAN.
Rispondi sempre in italiano in modo chiaro e conciso. Presenta i risultati in modo leggibile.
Se trovi dataset rilevanti, mostra: nome, organizzazione, descrizione breve e link.`;

  for (let round = 0; round < 5; round++) {
    const response = await anthropic.messages.create({
      model: model || ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools,
      messages: history,
    });

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { reply: text, toolCalls: toolCallsLog };
    }

    if (response.stop_reason === "tool_use") {
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        console.log(`[tool] ${block.name}`, JSON.stringify(block.input).slice(0, 120));
        toolCallsLog.push({ tool: block.name, args: block.input });
        let result;
        try {
          result = await callTool(block.name, block.input);
        } catch (e) {
          result = `Errore: ${e.message}`;
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
      history.push({ role: "user", content: toolResults });
    }
  }

  return { reply: "Nessuna risposta ottenuta.", toolCalls: toolCallsLog };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/api/models", async (req, res) => {
  res.json([
    { name: "claude-haiku-4-5-20251001" },
    { name: "claude-sonnet-4-6" },
  ]);
});

app.get("/api/tools", async (req, res) => {
  try {
    toolsCache = null;
    const tools = await getTools();
    res.json(tools);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, model } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "messages required" });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY non impostata" });
  }
  try {
    const { reply, toolCalls } = await chatWithTools(messages, model);
    res.json({ reply, toolCalls });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/health", async (req, res) => {
  const status = { backend: "ok", ollama: "n/a", mcp: "unknown" };
  try {
    await mcpCall("tools/list");
    status.mcp = "ok";
  } catch {}
  res.json(status);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend pronto su http://localhost:${PORT}`);
  console.log(`Raggiungibile su http://192.168.0.88:${PORT}`);
});