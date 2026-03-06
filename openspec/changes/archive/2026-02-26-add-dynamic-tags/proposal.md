# Change: Add dynamic tag discovery for CKAN portals

## Why
Current tag discovery in some MCP servers relies on static, manually curated lists. This quickly becomes outdated and limits discovery. A dynamic tag listing tool provides always-fresh tags straight from CKAN, improving search accuracy and user trust.

## What Changes
- Add a new MCP tool for dynamic tag discovery backed by CKAN faceting.
- Support optional dataset query filtering and tag substring filtering.
- Return tag names with dataset counts, formatted for markdown or JSON.
- Add a design note for technical decisions (see design.md).

## Impact
- Affected specs: `ckan-tags` (new capability)
- Affected code: `src/tools/` (new tool), `src/index.ts`/tool registry, tests and docs
