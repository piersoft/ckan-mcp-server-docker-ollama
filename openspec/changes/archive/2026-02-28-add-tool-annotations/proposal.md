# Proposal: add-tool-annotations

## Summary

Add `title` annotation to all MCP tools and migrate `quality.ts` tools from the deprecated `server.tool()` API to `server.registerTool()` with full annotations.

## Motivation

The MCP `ToolAnnotations` schema supports a `title` field (human-readable label) alongside the behavioral hints already present (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`). The `title` is surfaced by MCP clients in UIs and tool pickers, improving discoverability.

Current state:
- 14 tools via `registerTool()` have behavioral hints but **no `title`**
- 2 tools in `quality.ts` use the deprecated `server.tool()` 4-arg form with **no annotations at all**

Inspired by: `malkreide/zurich-opendata-mcp` pattern (see `tmp/zurich-opendata-mcp-analysis.md`).

## Scope

**In scope**:
- Add `title` to annotations of all 14 tools that already use `registerTool()`
- Migrate 2 `quality.ts` tools from `server.tool()` to `registerTool()` and add full annotations

**Out of scope**:
- Changing behavioral hint values (they are correct as-is)
- Changing tool descriptions or schemas
- Adding new tools

## Affected Files

| File | Tools | Change |
|------|-------|--------|
| `src/tools/package.ts` | `ckan_package_search`, `ckan_package_show`, `ckan_find_datasets`, `ckan_tag_list` (via package) | Add `title` |
| `src/tools/organization.ts` | `ckan_organization_list`, `ckan_organization_show`, `ckan_organization_search` | Add `title` |
| `src/tools/group.ts` | `ckan_group_list`, `ckan_group_show`, `ckan_group_search` | Add `title` |
| `src/tools/datastore.ts` | `ckan_datastore_search`, `ckan_datastore_search_sql` | Add `title` |
| `src/tools/tag.ts` | `ckan_tag_list` | Add `title` |
| `src/tools/status.ts` | `ckan_status_show` | Add `title` |
| `src/tools/quality.ts` | `ckan_get_mqa_quality`, `ckan_get_mqa_quality_details` | Migrate to `registerTool()` + add full annotations |

## Proposed `title` Values

| Tool name | Title |
|-----------|-------|
| `ckan_package_search` | Search Datasets |
| `ckan_package_show` | Get Dataset Details |
| `ckan_find_datasets` | Find Datasets by Topic |
| `ckan_organization_list` | List Organizations |
| `ckan_organization_show` | Get Organization Details |
| `ckan_organization_search` | Search Organizations |
| `ckan_group_list` | List Groups |
| `ckan_group_show` | Get Group Details |
| `ckan_group_search` | Search Groups |
| `ckan_datastore_search` | Query DataStore Table |
| `ckan_datastore_search_sql` | Query DataStore with SQL |
| `ckan_tag_list` | List Tags |
| `ckan_status_show` | Get Portal Status |
| `ckan_get_mqa_quality` | Get MQA Quality Score |
| `ckan_get_mqa_quality_details` | Get MQA Quality Details |

## Implementation Notes

- `quality.ts` migration: replace `server.tool(name, description, schema, handler)` with `server.registerTool(name, { description, inputSchema, annotations }, handler)` — same behavior, just different call shape
- No logic changes, no schema changes, no test changes needed
- Build + lint verification sufficient (no new test scenarios)

## Unresolved Questions

- None. Scope is clear and the SDK supports all required fields.
