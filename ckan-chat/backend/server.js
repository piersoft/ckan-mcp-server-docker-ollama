import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

const app = express();

//app.use(cors({
//  origin: ["https://mcp.piersoftckan.biz"],
//  methods: ["GET", "POST"],
//}));

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
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL   = process.env.MISTRAL_MODEL || "mistral-small-latest";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

// Ollama
const OLLAMA_URL   = process.env.OLLAMA_URL   || "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

console.log(`Motore LLM: ${LLM_PROVIDER === "mistral" ? `Mistral (${MISTRAL_MODEL})` : `Ollama (${OLLAMA_URL} - ${OLLAMA_MODEL})`}`);
console.log(`MCP URL: ${MCP_URL}`);

// ─── MCP helpers ──────────────────────────────────────────────────────────────

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
  const headers = {
    "Content-Type": "application/json",
    ...(process.env.OLLAMA_API_KEY
      ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
      : {}),
  };
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers,
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

// ─── Guardrail: classificatore domanda ───────────────────────────────────────

const GUARDRAIL_PROMPT = `Sei un classificatore. Il tuo unico compito è decidere se la domanda dell'utente riguarda open data, dataset, portali dati, CKAN, dati aperti, statistiche pubbliche, API di dati, risorse informative pubbliche o argomenti correlati.
Rispondi SOLO con la parola SI se la domanda è pertinente, oppure SOLO con la parola NO se non lo è.
Non aggiungere nulla altro, nessuna spiegazione, nessun punto, nessuno spazio.`;

async function isQuestionOnTopic(userMessage) {
  try {
    if (LLM_PROVIDER === "mistral") {
      const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages: [
            { role: "system", content: GUARDRAIL_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 5,
          temperature: 0,
        }),
      });
      if (!response.ok) return true;
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase() ?? "SI";
      console.log(`[guardrail] risposta classificatore: "${answer}"`);
      return answer.startsWith("SI");
    } else {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: GUARDRAIL_PROMPT },
            { role: "user", content: userMessage },
          ],
          stream: false,
          options: { temperature: 0, num_predict: 5 },
        }),
      });
      if (!res.ok) return true;
      const data = await res.json();
      const answer = data.message?.content?.trim().toUpperCase() ?? "SI";
      console.log(`[guardrail] risposta classificatore: "${answer}"`);
      return answer.startsWith("SI");
    }
  } catch (e) {
    console.error("[guardrail] errore classificatore, lascio passare:", e.message);
    return true;
  }
}

// ─── Agentic loop (provider-agnostico) ───────────────────────────────────────

const SYSTEM_PROMPT = `Sei un assistente specializzato esclusivamente in open data e portali CKAN.
Il tuo unico scopo è aiutare l'utente a cercare, esplorare e comprendere dataset e dati aperti.
Hai accesso a strumenti per interrogare portali CKAN in tempo reale.

REGOLE FONDAMENTALI:
- Usa SEMPRE gli strumenti disponibili per rispondere con dati reali aggiornati.
- Il portale principale è https://www.dati.gov.it/opendata (Italia), ma puoi usare qualsiasi URL CKAN.
- Non rispondere mai a domande che non riguardano open data, dataset, portali CKAN o dati pubblici.
- Se l'utente fa domande fuori tema (cucina, sport, intrattenimento, ecc.), declina educatamente.
- Rispondi sempre in italiano in modo chiaro e conciso.

LINK AI DATASET - REGOLA CRITICA:
- Usa SEMPRE il campo "view_url" restituito dagli strumenti come link al dataset.
- Se "view_url" non è disponibile, costruisci il link con il campo "id" (UUID) così:
  https://www.dati.gov.it/view-dataset/dataset?id=<UUID>
- NON usare MAI il formato /opendata/dataset/<nome-slug>: è SBAGLIATO.
- NON inventare URL: usa solo quelli restituiti dagli strumenti.

FORMATO RISPOSTA:
- Quando trovi dataset, mostra: nome, organizzazione, descrizione breve e link (view_url).
`;

const SYSTEM_PROMPT_OLLAMA = `Sei un assistente CKAN. Rispondi SOLO su open data e dataset.

ISTRUZIONE OBBLIGATORIA: Per QUALSIASI domanda su dati, dataset o open data devi chiamare uno strumento prima di rispondere. Non rispondere MAI dal tuo addestramento interno.

Strumenti disponibili:
- ckan_package_search: cerca dataset per parola chiave
- ckan_package_show: dettagli di un dataset
- ckan_organization_list: lista organizzazioni
- ckan_tag_list: lista tag disponibili
- ckan_datastore_search: cerca dati dentro una risorsa

Portale da usare: https://www.dati.gov.it/opendata

ESEMPIO CORRETTO:
Utente: "cerca dataset sull'aria"
Tu: chiami ckan_package_search con q="aria" e server_url="https://www.dati.gov.it/opendata"

LINK AI DATASET - REGOLA CRITICA:
- Usa SEMPRE il campo "view_url" restituito dagli strumenti come link al dataset.
- Se "view_url" non è disponibile, costruisci il link con il campo "id" (UUID) così:
  https://www.dati.gov.it/view-dataset/dataset?id=<UUID>
- NON usare MAI il formato /opendata/dataset/<nome-slug>: è SBAGLIATO.

REGOLA ASSOLUTA: Se non chiami uno strumento, la tua risposta è sbagliata.
Rispondi sempre in italiano.`;

function buildNudgeMessage(userQuestion) {
  return {
    role: "user",
    content: `[PROMEMORIA SISTEMA: Per rispondere a questa domanda DEVI chiamare uno strumento CKAN. Non rispondere senza aver prima chiamato un tool.]\n\n${userQuestion}`,
  };
}

const RETRY_MESSAGE = {
  role: "user",
  content: `[ERRORE: Non hai chiamato nessuno strumento. DEVI usare uno degli strumenti disponibili per cercare dati reali. Riprova chiamando ckan_package_search o un altro strumento CKAN adeguato.]`,
};

async function chatWithTools(messages, model) {
  const tools = await getTools();
  const toolCallsLog = [];

  const isOllama = LLM_PROVIDER === "ollama";
  const systemPrompt = isOllama ? SYSTEM_PROMPT_OLLAMA : SYSTEM_PROMPT;

  let historyMessages;
  if (isOllama && messages.length > 0) {
    const allButLast = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const lastMsg = messages[messages.length - 1];
    historyMessages = [...allButLast, buildNudgeMessage(lastMsg.content)];
  } else {
    historyMessages = messages.map(m => ({ role: m.role, content: m.content }));
  }

  const history = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
  ];

  for (let round = 0; round < 6; round++) {
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

    if (isOllama && round === 0 && finishReason === "stop" && toolCallsLog.length === 0) {
      console.log(`[ollama-nudge] round ${round}: nessun tool chiamato, inietto retry message`);
      history.push(msg);
      history.push(RETRY_MESSAGE);
      continue;
    }

    history.push(msg);

    if (finishReason === "stop" || finishReason === "end_turn" || !msg.tool_calls?.length) {
      const reply = typeof msg.content === "string"
        ? msg.content
        : msg.content?.filter(b => b.type === "text").map(b => b.text).join("\n") ?? "";
      if (isOllama && toolCallsLog.length === 0) {
        console.warn(`[ollama-nudge] risposta finale senza tool call dopo ${round + 1} round`);
      }
      return { reply, toolCalls: toolCallsLog };
    }

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

      if (LLM_PROVIDER === "mistral") {
        history.push({ role: "tool", tool_call_id: tc.id, name: fnName, content: result });
      } else {
        history.push({ role: "tool", content: result });
      }
    }
  }

  return { reply: "Nessuna risposta ottenuta.", toolCalls: toolCallsLog };
}

// ─── Risposta di rifiuto fuori tema ──────────────────────────────────────────

const OFF_TOPIC_REPLY = `Mi dispiace, posso aiutarti solo con domande relative a **open data**, **dataset** e **portali CKAN**.

Prova a chiedermi, ad esempio:
- 🔍 "Cerca dataset sulla qualità dell'aria"
- 📊 "Quanti dataset ci sono su mobilità a Roma?"
- 🌐 "Mostrami i dati aperti del comune di Milano"`;

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

  const onTopic = await isQuestionOnTopic(lastMsg);
  if (!onTopic) {
    console.log(`[guardrail] domanda fuori tema bloccata: "${lastMsg.slice(0, 80)}"`);
    return res.json({ reply: OFF_TOPIC_REPLY, toolCalls: [] });
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
