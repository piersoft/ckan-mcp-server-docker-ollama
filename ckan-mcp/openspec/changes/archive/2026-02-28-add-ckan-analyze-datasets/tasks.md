# Tasks: add-ckan-analyze-datasets

## Phase 1: Implementation

- [ ] Create `src/tools/analyze.ts` with `registerAnalyzeTools(server)`
  - Tool name: `ckan_analyze_datasets`
  - Input schema: `server_url`, `q`, `rows` (default 5, max 20)
  - Logic: `package_search` → for each result with `datastore_active` resources → `datastore_search?limit=0`
  - Include `info.label` and `info.notes` when present in field metadata
  - Output: markdown (default) and JSON format
- [ ] Register in `src/server.ts` via `registerAnalyzeTools`

## Phase 2: Tests

- [ ] Add fixture: `tests/fixtures/responses/analyze-datasets.json`
- [ ] Add integration test: `tests/integration/analyze.test.ts`

## Phase 3: Validation

- [ ] `npm run build`
- [ ] `npm test`
- [ ] HTTP smoke test against `https://dati.comune.messina.it`

## Review

_To be filled after implementation._
