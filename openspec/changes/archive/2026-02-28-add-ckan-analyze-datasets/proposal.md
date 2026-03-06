# Proposal: add-ckan-analyze-datasets

## Why

When an AI assistant needs to query a CKAN DataStore, it currently requires multiple round-trips:

1. `ckan_package_search` — find datasets
2. `ckan_package_show` — get resource IDs
3. `ckan_datastore_search` with `limit=0` — discover field schema per resource

The `ckan_datastore_search?limit=0` response already returns rich field metadata when portals use the CKAN DataStore Dictionary:

```json
{
  "id": "numero",
  "type": "numeric",
  "info": {
    "label": "Numero ordinanza",
    "notes": "Numero progressivo dell'ordinanza viabile"
  }
}
```

A single tool that combines search + schema introspection reduces this to one call and surfaces label/notes when available.

Inspired by: `malkreide/zurich-opendata-mcp` `zurich_analyze_datasets` pattern (see `tmp/zurich-opendata-mcp-analysis.md`).

## What Changes

### New tool: `ckan_analyze_datasets`

- Input: `server_url`, `q` (search query), `rows` (max datasets to inspect, default 5)
- For each dataset found: lists DataStore-enabled resources with field schema (`id`, `type`, `label`, `notes`) and record count
- Non-DataStore resources are listed without schema (name + format only)
- Output: markdown (default) or JSON

### Implementation

- New file: `src/tools/analyze.ts` with `registerAnalyzeTools(server)`
- Registered in `src/server.ts`
- Uses existing `makeCkanRequest` for all API calls
- Two sequential CKAN calls per DataStore resource: `package_search` then `datastore_search?limit=0`

## What Does NOT Change

- Existing tools untouched
- No schema changes to existing tools
- `info.label`/`info.notes` are included when present, silently omitted when absent

## Unresolved Questions

- None.
