## 1. Datastore table improvements
- [x] 1.1 In `formatDatastoreSearchMarkdown`: filter out `_id` from `displayFields`; change truncation from 50→80 chars (update both `substring(0, 47)` occurrences)
- [x] 1.2 In `formatDatastoreSqlMarkdown`: same — filter `_id` from `displayFields`; change truncation from 50→80 chars
- [x] 1.3 Build: `npm run build` — no errors

## 2. Organization/group dataset count clarity
- [x] 2.1 In `formatOrganizationShowMarkdown`: change `## Datasets (N)` to `## Datasets (showing M of N returned — T total)` using `packages.length`, displayed count, and `package_count`
- [x] 2.2 In `formatGroupShowMarkdown`: same fix
- [x] 2.3 Build: `npm run build` — no errors

## 3. Update unit tests
- [x] 3.1 Update `tests/unit/datastore-formatting.test.ts`: assert `_id` absent from table header; assert truncation at 80 chars
- [x] 3.2 Update `tests/unit/organization-formatting.test.ts`: assert new `## Datasets (showing M of N returned` heading
- [x] 3.3 Update `tests/unit/group-formatting.test.ts`: assert new `## Datasets (showing M of N returned` heading

## 4. Final validation
- [x] 4.1 Run `npm run build && npm test` — all green (272 tests)
- [x] 4.2 Start HTTP server and verify output visually with real portals
- [x] 4.3 Update LOG.md
