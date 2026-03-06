# Spec: mcp-tool-annotations

## ADDED Requirements

### Requirement: All MCP tools expose a human-readable `title` annotation

Every tool registered with the MCP server MUST include a `title` field in its `annotations` block.
The `title` MUST be a short, English, human-readable label (2–5 words) suitable for display in tool pickers and UIs.

#### Scenario: Client inspects tool list
Given an MCP client requests the tool list,
When it reads tool metadata,
Then each tool entry contains `annotations.title` as a non-empty string.

#### Scenario: Title is distinct from tool name
Given any registered tool,
Then `annotations.title` is human-readable prose (e.g., "Search Datasets") and differs from the snake_case tool name (e.g., `ckan_package_search`).

### Requirement: All tools use `registerTool()` (non-deprecated API)

All tool registrations MUST use `server.registerTool()`.
The deprecated `server.tool()` form MUST NOT be used.

#### Scenario: quality.ts tools migrated
Given `src/tools/quality.ts`,
When inspecting tool registration calls,
Then `server.tool()` is no longer used and both tools use `server.registerTool()`.

#### Scenario: Behavior unchanged after migration
Given `ckan_get_mqa_quality` and `ckan_get_mqa_quality_details`,
When called with valid parameters after migration,
Then they return the same output as before migration.
