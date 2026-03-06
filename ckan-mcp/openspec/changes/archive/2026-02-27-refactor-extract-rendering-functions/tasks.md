## 1. datastore.ts
- [x] 1.1 Extract inline search rendering into `export function formatDatastoreSearchMarkdown(result, serverUrl, resourceId, offset, limit)`
- [x] 1.2 Extract inline SQL rendering into `export function formatDatastoreSqlMarkdown(result, serverUrl, sql)`
- [x] 1.3 Replace inline rendering in both handlers with calls to the extracted functions
- [x] 1.4 Build: `npm run build` — no errors

## 2. organization.ts
- [x] 2.1 Extract inline show rendering into `export function formatOrganizationShowMarkdown(result, serverUrl)`
- [x] 2.2 Replace inline rendering in handler with call to extracted function
- [x] 2.3 Build: `npm run build` — no errors

## 3. group.ts
- [x] 3.1 Extract inline show rendering into `export function formatGroupShowMarkdown(result, serverUrl)`
- [x] 3.2 Replace inline rendering in handler with call to extracted function
- [x] 3.3 Build: `npm run build` — no errors

## 4. status.ts
- [x] 4.1 Extract inline rendering into `export function formatStatusMarkdown(result, serverUrl)`
- [x] 4.2 Replace inline rendering in handler with call to extracted function
- [x] 4.3 Build: `npm run build` — no errors

## 5. Unit tests
- [x] 5.1 Write `tests/unit/datastore-formatting.test.ts` — 9 tests (search + SQL)
- [x] 5.2 Write `tests/unit/organization-formatting.test.ts` — 6 tests
- [x] 5.3 Write `tests/unit/group-formatting.test.ts` — 6 tests
- [x] 5.4 Write `tests/unit/status-formatting.test.ts` — 5 tests

## 6. Final validation
- [x] 6.1 Run `npm run build && npm test` — 270 passed (was 244), all green
- [x] 6.2 Update LOG.md
