# rendering-testability Specification

## Purpose
TBD - created by archiving change refactor-extract-rendering-functions. Update Purpose after archive.
## Requirements
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

**Datastore table rendering** SHALL:
- Skip the `_id` field from display columns (CKAN internal sequential integer, no domain value)
- Truncate cell values at 80 characters (not 50) before appending `...`

**Organization and group datasets section** SHALL:
- Use `## Datasets (showing M of N returned)` when packages are sliced for display, where M is the displayed count and N is `packages.length`
- Append `(total: T)` when `package_count` is known and differs from N

#### Scenario: Handler output unchanged after extraction
- **WHEN** the handler calls the extracted function with the same inputs as before
- **THEN** the returned markdown string is identical to what the inline rendering produced

#### Scenario: Rendering function is importable in tests
- **WHEN** a unit test imports `formatDatastoreSearchMarkdown` from `src/tools/datastore`
- **THEN** the import succeeds and the function can be called with a fixture response

#### Scenario: Datastore table skips _id column
- **WHEN** `formatDatastoreSearchMarkdown` is called with a result whose first field is `_id`
- **THEN** the markdown table header does not contain `_id`
- **AND** the first displayed column is the next meaningful field

#### Scenario: Datastore cell truncation at 80 chars
- **WHEN** a cell value is 90 characters long
- **THEN** the rendered cell shows the first 77 characters followed by `...`

#### Scenario: Organization datasets section with count clarity
- **WHEN** `formatOrganizationShowMarkdown` is called with 50 packages and `package_count` of 186
- **THEN** the section header reads `## Datasets (showing 20 of 50 returned — 186 total)`

#### Scenario: Group datasets section with count clarity
- **WHEN** `formatGroupShowMarkdown` is called with 2 packages and `package_count` of 12
- **THEN** the section header reads `## Datasets (showing 2 of 2 returned — 12 total)`

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
- **THEN** output contains `## Fields`, `## Records`, a markdown table header without `_id`, and a pagination hint

#### Scenario: Organization show rendering test
- **WHEN** `formatOrganizationShowMarkdown` is called with `organization-show-success.json` fixture
- **THEN** output contains `## Details`, the org name, and dataset count

#### Scenario: Group show rendering test
- **WHEN** `formatGroupShowMarkdown` is called with `group-show-success.json` fixture
- **THEN** output contains `## Details` and the group name

#### Scenario: Status rendering test
- **WHEN** `formatStatusMarkdown` is called with `status-success.json` fixture
- **THEN** output contains `✅ Online` and the CKAN version string

