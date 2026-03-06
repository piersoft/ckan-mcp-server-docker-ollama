# Change: Extract rendering functions from handler closures

## Why

Markdown rendering logic in `datastore.ts`, `organization.ts`, `group.ts`, and `status.ts` lives inside anonymous handler closures passed to `server.registerTool()`. These closures cannot be imported or called in tests, leaving the rendered output — what users actually see — with zero test coverage.

The pattern already exists in `package.ts`: `formatPackageShowMarkdown` is an exported function with a dedicated unit test file `tests/unit/package-show-formatting.test.ts`. This change replicates that pattern for the remaining four tool files.

## What Changes

- `datastore.ts`: extract `formatDatastoreSearchMarkdown(result, serverUrl, params)` and `formatDatastoreSqlMarkdown(result, serverUrl, sql)` as exported functions
- `organization.ts`: extract `formatOrganizationShowMarkdown(result, serverUrl)` as an exported function
- `group.ts`: extract `formatGroupShowMarkdown(result, serverUrl)` as an exported function
- `status.ts`: extract `formatStatusMarkdown(result, serverUrl)` as an exported function
- Add unit test files for each: `tests/unit/datastore-formatting.test.ts`, `tests/unit/organization-formatting.test.ts`, `tests/unit/group-formatting.test.ts`, `tests/unit/status-formatting.test.ts`
- Reuse existing fixtures in `tests/fixtures/responses/` — no new fixtures needed
- No behavioral change — handlers call the extracted functions identically

## Impact

- Affected specs: new capability `rendering-testability`
- Affected code: `src/tools/datastore.ts`, `src/tools/organization.ts`, `src/tools/group.ts`, `src/tools/status.ts`, new test files in `tests/unit/`
- No breaking changes; no runtime behavior changes
- Increases tool handler test coverage from ~15% toward meaningful coverage of output formatting
