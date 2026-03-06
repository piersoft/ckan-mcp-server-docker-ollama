# scripts/

Service scripts for the CKAN MCP Server project.

## worker_telemetry_archiver.py

Fetches Cloudflare Worker telemetry events via the Observability API and archives them to `data/worker_events.jsonl`.

Each run:
1. Fetches events since the last run (incremental, state in `data/worker_telemetry_last_run.json`)
2. Uses 24h chunks to avoid API downsampling
3. Merges with existing data, deduplicates by event id, sorts by timestamp desc

**Requirements**: `CF_API_TOKEN` env var or in `.env`. Free plan: 3-day retention. Paid: 7 days.

```bash
# Incremental update (default: since last run)
python3 scripts/worker_telemetry_archiver.py

# First run: backfill N days (max 7 paid, 3 free)
python3 scripts/worker_telemetry_archiver.py --backfill-days 3

# Daemon mode: loop every 24h
python3 scripts/worker_telemetry_archiver.py --daemon
```

## worker_telemetry_flatten.py

Reads `data/worker_events.jsonl` and generates `data/worker_events_flat.jsonl` — a flat,
analysis-ready version with only the essential fields. Excludes GET probe events (MCP client
health checks, no tool involved).

Output fields:

| field | source | notes |
|---|---|---|
| `id` | `$metadata.id` | unique event id |
| `timestamp` | `timestamp` | ISO 8601 UTC |
| `outcome` | `$workers.outcome` | `ok` / `exception` |
| `tool` | `source.tool` | MCP tool name |
| `server` | `source.server` | CKAN portal URL |
| `query` | `source.q` / `source.query` / `source.id` / `source.pattern` / `source.sql` | unified search term |
| `error` | `$metadata.error` | null if ok |

```bash
python3 scripts/worker_telemetry_flatten.py
```

## GitHub Actions

`update-telemetry.yml` runs both scripts automatically twice a day (06:00 and 18:00 UTC).
Requires the `CF_API_TOKEN` repository secret.
