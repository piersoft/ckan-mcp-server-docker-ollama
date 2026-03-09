import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";
const app = express();
app.use(cors({
  origin: ["https://mcp.piersoftckan.biz"],
  methods: ["GET", "POST"],
}));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});

app.use("/api/chat", rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Troppe richieste, riprova tra un minuto." }
}));

// ─── Configurazione provider ──────────────────────────────────────────────────
const LLM_PROVIDER = process.env.LLM_PROVIDER || "mistral"; // "mistral" | "ollama"
const MCP_URL = process.env.MCP_URL || "http://ckan-mcp-server:3000/mcp";

// Mistral
const MISTRAL_API_KEY   = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL     = process.env.MISTRAL_MODEL || "mistral-small-latest";
const MISTRAL_API_URL   = "https://api.mistral.ai/v1/chat/completions";

// Ollama
const OLLAMA_URL   = process.env.OLLAMA_URL || "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

console.log(`Motore LLM: ${LLM_PROVIDER === "mistral" ? `Mistral (${MISTRAL_MODEL})` : `Ollama (${OLLAMA_URL} - ${OLLAMA_MODEL})`}`);
console.log(`MCP URL: ${MCP_URL}`);

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

async function callTool(name, args) {
  const res = await mcpCall("tools/call", { name, arguments: args });
  const content = res.result?.content ?? [];
  return content.map((c) => c.text ?? JSON.stringify(c)).join("\n");
}

// ─── Mistral chat ─────────────────────────────────────────────────────────────

function mcpToolToMistral(tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ?? { type: "object", properties: {} },
    },
  };
}

async function mistralChat(history, tools, model) {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || MISTRAL_MODEL,
        messages: history,
        tools,
        tool_choice: "auto",
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });
    if (response.status !== 429) break;
    console.log(`[rate limit] attendo 2s (tentativo ${attempt + 1})`);
    await new Promise(r => setTimeout(r, 2000));
  }
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral error ${response.status}: ${err}`);
  }
  return await response.json();
}

// ─── Ollama chat ──────────────────────────────────────────────────────────────

function mcpToolToOllama(tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ?? { type: "object", properties: {} },
    },
  };
}

async function ollamaChat(history, tools, model) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || OLLAMA_MODEL,
      messages: history,
      tools,
      stream: false,
      options: { temperature: 0.3 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }
  return await res.json();
}

// ─── Agentic loop (provider-agnostico) ───────────────────────────────────────

const SYSTEM_PROMPT = `Sei un assistente esperto di open data. Hai accesso a strumenti per interrogare portali CKAN.
Quando l'utente chiede di cercare dataset, usa SEMPRE gli strumenti disponibili per interrogare dati reali.
Il portale principale è https://www.dati.gov.it/opendata (Italia), ma puoi usare qualsiasi URL CKAN.
Rispondi sempre in italiano in modo chiaro e conciso. Presenta i risultati in modo leggibile.
Se trovi dataset rilevanti, mostra: nome, organizzazione, descrizione breve e link.`;

async function chatWithTools(messages, model) {
  const tools = await getTools();
  const toolCallsLog = [];

  const history = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let round = 0; round < 5; round++) {
    if (round > 0) await new Promise(r => setTimeout(r, 1200));

    let msg, finishReason;

    if (LLM_PROVIDER === "mistral") {
      const data = await mistralChat(history, tools.map(mcpToolToMistral), model);
      msg = data.choices[0].message;
      finishReason = data.choices[0].finish_reason;
    } else {
      const data = await ollamaChat(history, tools.map(mcpToolToOllama), model);
      msg = data.message;
      finishReason = msg.tool_calls?.length ? "tool_calls" : "stop";
    }

    history.push(msg);

    // Risposta finale
    if (finishReason === "stop" || finishReason === "end_turn" || !msg.tool_calls?.length) {
      const reply = typeof msg.content === "string"
        ? msg.content
        : msg.content?.filter(b => b.type === "text").map(b => b.text).join("\n") ?? "";
      return { reply, toolCalls: toolCallsLog };
    }

    // Esegui tool calls
    for (const tc of msg.tool_calls) {
      const fnName = tc.function.name;
      const fnArgs = typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments;

      console.log(`[tool] ${fnName}`, JSON.stringify(fnArgs).slice(0, 120));
      toolCallsLog.push({ tool: fnName, args: fnArgs });

      let result;
      try {
        result = await callTool(fnName, fnArgs);
      } catch (e) {
        result = `Errore: ${e.message}`;
      }

      // Formato risposta tool diverso tra Mistral e Ollama
      if (LLM_PROVIDER === "mistral") {
        history.push({ role: "tool", tool_call_id: tc.id, name: fnName, content: result });
      } else {
        history.push({ role: "tool", content: result });
      }
    }
  }

  return { reply: "Nessuna risposta ottenuta.", toolCalls: toolCallsLog };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/api/models", (req, res) => {
  if (LLM_PROVIDER === "mistral") {
    res.json([
      { name: "mistral-medium-latest" },
    ]);
  } else {
    fetch(`${OLLAMA_URL}/api/tags`)
      .then(r => r.json())
      .then(data => res.json(data.models ?? []))
      .catch(() => res.json([]));
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

const BLOCKLIST = ["ignore previous", "system prompt", "forget instructions",
                   "new instructions", "disregard", "jailbreak"];

app.post("/api/chat", async (req, res) => {
  const { messages, model } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "messages required" });
  // Sanitizzazione prompt injection
  const lastMsg = messages[messages.length - 1]?.content ?? "";
  if (typeof lastMsg !== "string" || lastMsg.length > 2000) {
    return res.status(400).json({ error: "Messaggio non valido o troppo lungo" });
  }
  if (BLOCKLIST.some(p => lastMsg.toLowerCase().includes(p))) {
    return res.status(400).json({ error: "Input non consentito" });
  }
  if (LLM_PROVIDER === "mistral" && !MISTRAL_API_KEY) {
    return res.status(500).json({ error: "MISTRAL_API_KEY non impostata nel .env" });
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
  if (LLM_PROVIDER === "ollama") {
    try {
      await fetch(`${OLLAMA_URL}/api/tags`);
      status.ollama = "ok";
    } catch {
      status.ollama = "error";
    }
  }
  try {
    await mcpCall("tools/list");
    status.mcp = "ok";
  } catch {}
  res.json(status);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend pronto su http://localhost:${PORT}`);
  console.log(`Raggiungibile su http://${process.env.SERVER_IP || "0.0.0.0"}:${PORT}`);
});
