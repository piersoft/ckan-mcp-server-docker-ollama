## ADDED Requirements

### Requirement: Exported Rendering Functions for Tool Handlers
The system SHALL expose named exported functions for markdown rendering in `datastore.ts`, `organization.ts`, `group.ts`, and `status.ts`, following the pattern established by `formatPackageShowMarkdown` in `package.ts`.

Each exported function SHALL:
- Accept the CKAN API result and `serverUrl` as parameters (plus any tool-specific params needed for pagination hints)
- Return a `string` (the markdown output)
- Be called by the existing handler closure in place of the inline rendering logic
- Produce output identical to the current inline rendering

Functions to export:
- `formatDatastoreSearchMarkdown(result, serverUrl, resourceId, offset, limit)` from `datastore.ts`
- `formatDatastoreSqlMarkdown(result, serverUrl, sql)` from `datastore.ts`
- `formatOrganizationShowMarkdown(result, serverUrl)` from `organization.ts`
- `formatGroupShowMarkdown(result, serverUrl)` from `group.ts`
- `formatStatusMarkdown(result, serverUrl)` from `status.ts`

#### Scenario: Handler output unchanged after extraction
- **WHEN** the handler calls the extracted function with the same inputs as before
- **THEN** the returned markdown string is identical to what the inline rendering produced

#### Scenario: Rendering function is importable in tests
- **WHEN** a unit test imports `formatDatastoreSearchMarkdown` from `src/tools/datastore`
- **THEN** the import succeeds and the function can be called with a fixture response

### Requirement: Unit Tests for Rendering Functions
Each extracted rendering function SHALL have a corresponding unit test file in `tests/unit/` that:
- Imports the function directly (not via MCP server)
- Uses existing fixtures from `tests/fixtures/responses/`
- Asserts key output patterns (section headers, field names, pagination hints)

Test files:
- `tests/unit/datastore-formatting.test.ts`
- `tests/unit/organization-formatting.test.ts`
- `tests/unit/group-formatting.test.ts`
- `tests/unit/status-formatting.test.ts`

#### Scenario: Datastore search rendering test
- **WHEN** `formatDatastoreSearchMarkdown` is called with `datastore-search-success.json` fixture
- **THEN** output contains `## Fields`, `## Records`, a markdown table header, and a pagination hint

#### Scenario: Organization show rendering test
- **WHEN** `formatOrganizationShowMarkdown` is called with `organization-show-success.json` fixture
- **THEN** output contains `## Details`, the org name, and dataset count

#### Scenario: Group show rendering test
- **WHEN** `formatGroupShowMarkdown` is called with `group-show-success.json` fixture
- **THEN** output contains `## Details` and the group name

#### Scenario: Status rendering test
- **WHEN** `formatStatusMarkdown` is called with `status-success.json` fixture
- **THEN** output contains `✅ Online` and the CKAN version string
