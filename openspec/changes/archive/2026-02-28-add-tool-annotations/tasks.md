# Tasks: add-tool-annotations

## Phase 1: Add `title` to existing `registerTool()` calls

- [x] N/A — all 14 tools already had `title` at the config level of `registerTool()`; no changes needed

## Phase 2: Migrate `quality.ts` to `registerTool()`

- [x] Migrate `ckan_get_mqa_quality` from `server.tool()` to `server.registerTool()` with full annotations
- [x] Migrate `ckan_get_mqa_quality_details` from `server.tool()` to `server.registerTool()` with full annotations

## Phase 3: Validation

- [x] `npm run build` — no errors
- [x] `npm test` — 272 tests pass
- [x] HTTP server smoke test — `ckan_package_search` confirmed working

## Review

- Scope narrower than proposed: the 14 `registerTool()` tools already had `title` at SDK config level
- Only real change: migrated 2 `quality.ts` tools from deprecated `server.tool()` to `registerTool()` + added `title`, `description`, `inputSchema`, `annotations`
- No logic or schema changes; behavior identical
