# Change: Improve markdown output quality

## Why

Three readability issues found during real HTTP server testing:

1. **Org/group dataset count confusion**: `## Datasets (50)` shows the number of packages returned by the API, not how many are displayed (20) or the org total (e.g. 186). Users see three different numbers with no explanation.

2. **Datastore `_id` column waste**: CKAN's internal `_id` column (sequential integer, no domain value) always occupies one of the 8 display slots, pushing out meaningful columns.

3. **Datastore cell truncation too aggressive**: 50-char limit cuts values mid-word and makes data unreadable. 80 chars gives more context without breaking table layout.

## What Changes

- `formatOrganizationShowMarkdown`: change `## Datasets (N)` to `## Datasets (showing M of N returned)`; add `package_count` total in parentheses when it differs
- `formatGroupShowMarkdown`: same fix as organization
- `formatDatastoreSearchMarkdown` and `formatDatastoreSqlMarkdown`: skip `_id` field from display columns; increase cell truncation from 50 to 80 chars
- Update unit tests to match new output format

## Impact

- Affected specs: `rendering-testability` (MODIFIED)
- Affected code: `src/tools/organization.ts`, `src/tools/group.ts`, `src/tools/datastore.ts`
- Affected tests: `tests/unit/organization-formatting.test.ts`, `tests/unit/group-formatting.test.ts`, `tests/unit/datastore-formatting.test.ts`
- No breaking changes to API or MCP tool interfaces
