# ckan-mcp-server-docker-ollama

Chat in linguaggio naturale sui dati aperti CKAN, con LLM configurabile (Ollama locale o Mistral AI).

```
[React Frontend :8080]
        ↓ HTTP
[Node.js Backend :3001]
        ↓                        ↓
[Ollama :11434]      [ckan-mcp-server :3000]
  oppure                  (dati.gov.it, ecc.)
[Mistral AI ☁️]
```

## Struttura della repo

```
ckan-mcp-server-docker-ollama/
├── .env.example                  ← configurazione (copia in .env)
├── docker-compose-full.yml       ← orchestrazione completa
├── ckan-mcp-server/              ← MCP server CKAN (submodule/fork)
│   ├── Dockerfile
│   └── src/
└── ckan-chat/
    ├── backend/
    │   ├── server.js             ← Express + agentic loop LLM ↔ MCP
    │   ├── package.json
    │   └── Dockerfile
    └── frontend/
        ├── src/
        │   ├── App.jsx
        │   ├── index.css
        │   └── components/
        │       ├── ChatMessage.jsx
        │       ├── ToolCallBadge.jsx
        │       └── StatusBar.jsx
        ├── index.html
        ├── package.json
        ├── vite.config.js
        └── Dockerfile
```

## Prerequisiti

- Docker + Docker Compose
- Se usi Ollama: almeno **8 GB di RAM** disponibili per la VM/host
- Se usi Mistral: una API key gratuita da [console.mistral.ai](https://console.mistral.ai)

## Configurazione

Copia il file di esempio e modificalo:

```bash
cp .env.example .env
nano .env
```

### Variabili disponibili

```env
# ─── Rete ────────────────────────────────────────────────────────────────────
SERVER_IP=192.168.0.126        # IP del server sulla rete locale

# ─── Porte ───────────────────────────────────────────────────────────────────
OLLAMA_PORT=11434
MCP_PORT=3000
BACKEND_PORT=3001
FRONTEND_PORT=8080

# ─── Provider LLM ────────────────────────────────────────────────────────────
# Scegli il provider: "ollama" oppure "mistral"
LLM_PROVIDER=mistral

# ─── Mistral AI (usato se LLM_PROVIDER=mistral) ──────────────────────────────
MISTRAL_API_KEY=la_tua_key
MISTRAL_MODEL=mistral-small-latest

# ─── Ollama (usato se LLM_PROVIDER=ollama) ───────────────────────────────────
OLLAMA_MODEL=qwen2.5:1.5b
```

**Per cambiare provider basta modificare `LLM_PROVIDER` nel `.env`** — nessun altro file va toccato.

## Avvio

```bash
# Prima volta (build completa)
docker compose -f docker-compose-full.yml up --build -d

# Aggiornamento solo del backend (dopo modifiche a server.js o .env)
docker compose -f docker-compose-full.yml up --build backend -d

# Stop
docker compose -f docker-compose-full.yml down
```

Il frontend sarà disponibile su `http://<SERVER_IP>:8080`

## Usare Mistral AI (🇫🇷 europeo, gratuito)

1. Registrati su [console.mistral.ai](https://console.mistral.ai)
2. Crea una API key
3. Nel `.env` imposta:

```env
LLM_PROVIDER=mistral
MISTRAL_API_KEY=la_tua_key
MISTRAL_MODEL=mistral-small-latest
```

Modelli disponibili nel piano gratuito:

| Modello | Note |
|---|---|
| `mistral-small-latest` | Il più capace nel piano free |
| `open-mistral-nemo` | Completamente open source |
| `mistral-medium-latest` | Più potente, piano a pagamento |

> Il piano gratuito ha un limite di 1 richiesta/secondo e ~500k token/mese — sufficiente per sviluppo e demo.

## Usare Ollama (completamente locale)

Nel `.env` imposta:

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:1.5b
```

Al primo avvio il container `ollama-pull` scarica automaticamente il modello scelto.

### Modelli consigliati con tool calling

| Modello | RAM necessaria | Tool calling | Note |
|---|---|---|---|
| `qwen2.5:1.5b` | 2 GB | ✅ | Minimo assoluto |
| `qwen3:1.7b` | 2 GB | ✅ | Più recente |
| `qwen3:4b` | 4 GB | ✅ | Buon equilibrio |
| `qwen2.5:7b` | 8 GB | ✅ | Consigliato |
| `mistral-nemo` | 8 GB | ✅ | 🇫🇷 europeo |

> ⚠️ Su macchine virtuali con poca RAM (<4 GB disponibili) Ollama risulta molto lento o inutilizzabile. In quel caso usa Mistral AI.

### Requisiti hardware minimi per Ollama in produzione

| Hardware | RAM | Modello usabile | Velocità |
|---|---|---|---|
| VM base | 4 GB | `qwen2.5:1.5b` | Lenta (~1 tok/sec) |
| Mini PC (es. Minisforum UM890) | 32 GB | `qwen2.5:7b` | ~15 tok/sec |
| Mac Mini M2 | 16 GB | `qwen2.5:7b` | ~25 tok/sec |
| PC con GPU RTX 3060 12GB | 16 GB + GPU | `qwen2.5:7b` | ~40 tok/sec |

## Integrare con Claude Desktop

Per usare il CKAN MCP server anche da Claude Desktop, aggiungi al file di configurazione:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ckan": {
      "command": "node",
      "args": ["/percorso/stdio-bridge.js"],
      "env": {
        "MCP_URL": "http://<SERVER_IP>:3000/mcp"
      }
    }
  }
}
```

> Vedi `stdio-bridge.js` per il bridge stdio→HTTP necessario con Claude Desktop.

## API Backend

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/health` | Stato di backend, LLM e MCP |
| GET | `/api/models` | Lista modelli disponibili |
| GET | `/api/tools` | Lista strumenti MCP CKAN |
| POST | `/api/chat` | Invia messaggio, ricevi risposta |

### POST /api/chat

```json
// Request
{
  "messages": [
    { "role": "user", "content": "Cerca dataset sulla qualità dell'aria" }
  ],
  "model": "mistral-small-latest"
}

// Response
{
  "reply": "Ho trovato 399 dataset sulla qualità dell'aria...",
  "toolCalls": [
    {
      "tool": "ckan_package_search",
      "args": {
        "server_url": "https://www.dati.gov.it/opendata",
        "q": "qualità aria"
      }
    }
  ]
}
```

## Portali CKAN supportati

Qualsiasi portale CKAN è interrogabile, esempi:

| Portale | URL |
|---|---|
| Italia | `https://www.dati.gov.it/opendata` |
| USA | `https://catalog.data.gov` |
| Canada | `https://open.canada.ca/data` |
| Australia | `https://data.gov.au` |
| UK | `https://data.gov.uk` |

## Log e troubleshooting

```bash
# Log backend
docker logs -f ckan-chat-backend

# Log MCP server
docker logs -f ckan-mcp-server

# Log Ollama
docker logs -f ollama

# Stato di tutti i container
docker compose -f docker-compose-full.yml ps
```

**Errore 429 Mistral** → rate limit superato, il backend riprova automaticamente dopo 2 secondi.

**Errore EAI_AGAIN** → il container non risolve il DNS. Verificare che nel `docker-compose-full.yml` il servizio backend abbia:
```yaml
dns:
  - 8.8.8.8
  - 1.1.1.1
```

**Ollama lento o bloccato** → RAM insufficiente. Usare Mistral AI oppure aumentare la RAM della VM.

## Licenza

MIT

## Credits
MCP server a cura di OnData
