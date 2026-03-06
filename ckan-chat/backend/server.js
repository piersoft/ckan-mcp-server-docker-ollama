import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ── Configurazione da variabili d'ambiente ────────────────────────────────────
const SERVER_IP    = process.env.SERVER_IP    || "localhost";
const PORT         = process.env.PORT         || 3001;
const MCP_URL      = process.env.MCP_URL      || `http://${SERVER_IP}:3000/mcp`;
const OLLAMA_URL   = process.env.OLLAMA_URL   || `http://${SERVER_IP}:11434`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:1.7b";

// Anthropic (opzionale)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null;
const ANTHROPIC_MODEL   = process.env.ANTHROPIC_MODEL   || "claude-haiku-4-5-20251001";

const USE_ANTHROPIC = !!ANTHROPIC_API_KEY;

console.log(`Motore LLM: ${USE_ANTHROPIC ? "Anthropic (" + ANTHROPIC_MODEL + ")" : "Ollama (" + OLLAMA_URL + " - " + OLLAMA_MODEL + ")"}`);
console.log(`MCP URL: ${MCP_URL}`);

// ── Importa Anthropic SDK solo se necessario ──────────────────────────────────
let anthropic = null;
if (USE_ANTHROPIC) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

// ── MCP helpers ───────────────────────────────────────────────────────────────
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

async function callTool(name, args) {
  const res = await mcpCall("tools/call", { name, arguments: args });
  const content = res.result?.content ?? [];
  return content.map((c) => c.text ?? JSON.stringify(c)).join("\n");
}

const SYSTEM_PROMPT = `Sei un assistente esperto di open data. Hai accesso a strumenti per interrogare portali CKAN.
Quando l'utente chiede di cercare dataset, usa SEMPRE gli strumenti disponibili per interrogare dati reali.
Il portale principale è https://www.dati.gov.it/opendata (Italia), ma puoi usare qualsiasi URL CKAN.
Rispondi sempre in italiano in modo chiaro e conciso. Presenta i risultati in modo leggibile.
Se trovi dataset rilevanti, mostra: nome, organizzazione, descrizione breve e link.`;

// ── Motore Ollama ─────────────────────────────────────────────────────────────
async function chatWithOllama(messages, model) {
  const tools = await getTools();
  const ollamaTools = tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema ?? { type: "object", properties: {} },
    },
  }));

  const toolCallsLog = [];
  let history = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

  for (let round = 0; round < 5; round++) {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || OLLAMA_MODEL,
        messages: history,
        tools: ollamaTools,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const msg = data.message;
    history.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { reply: msg.content, toolCalls: toolCallsLog };
    }

    for (const tc of msg.tool_calls) {
      const fnName = tc.function.name;
      const fnArgs = tc.function.arguments ?? {};
      console.log(`[tool] ${fnName}`, JSON.stringify(fnArgs).slice(0, 120));
      toolCallsLog.push({ tool: fnName, args: fnArgs });
      let result;
      try { result = await callTool(fnName, fnArgs); }
      catch (e) { result = `Errore: ${e.message}`; }
      history.push({ role: "tool", content: result });
    }
  }
  return { reply: "Nessuna risposta.", toolCalls: toolCallsLog };
}

// ── Motore Anthropic ──────────────────────────────────────────────────────────
async function chatWithAnthropic(messages, model) {
  const tools = await getTools();
  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema ?? { type: "object", properties: {} },
  }));

  const toolCallsLog = [];
  let history = messages.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round < 5; round++) {
    const response = await anthropic.messages.create({
      model: model || ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
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
        try { result = await callTool(block.name, block.input); }
        catch (e) { result = `Errore: ${e.message}`; }
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }
      history.push({ role: "user", content: toolResults });
    }
  }
  return { reply: "Nessuna risposta.", toolCalls: toolCallsLog };
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/models", async (req, res) => {
  if (USE_ANTHROPIC) {
    return res.json([
      { name: "claude-haiku-4-5-20251001" },
      { name: "claude-sonnet-4-6" },
    ]);
  }
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    res.json(data.models ?? []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/tools", async (req, res) => {
  try {
    toolsCache = null;
    res.json(await getTools());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, model } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "messages required" });
  try {
    const result = USE_ANTHROPIC
      ? await chatWithAnthropic(messages, model)
      : await chatWithOllama(messages, model);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/health", async (req, res) => {
  const status = { backend: "ok", ollama: "n/a", mcp: "unknown" };
  if (!USE_ANTHROPIC) {
    try {
      await fetch(`${OLLAMA_URL}/api/tags`);
      status.ollama = "ok";
    } catch { status.ollama = "error"; }
  }
  try {
    await mcpCall("tools/list");
    status.mcp = "ok";
  } catch {}
  res.json(status);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend pronto su http://localhost:${PORT}`);
  console.log(`Raggiungibile su http://${SERVER_IP}:${PORT}`);
});
