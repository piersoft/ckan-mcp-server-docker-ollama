## 1. Define domain types in src/types.ts
- [x] 1.1 Add `CkanTag`, `CkanResource`, `CkanPackage` types
- [x] 1.2 Add `CkanOrganization`, `CkanField`, `CkanDatastoreResult` types
- [x] 1.3 Build: `npm run build` — no errors

## 2. Replace `any` in package.ts
- [x] 2.1 Type `dataset` param in `scoreDatasetRelevance` as `CkanPackage`
- [x] 2.2 Type `resource` param in `parseAccessServices` and `resolveDownloadUrl` as `CkanResource`
- [x] 2.3 Type `result` param in `enrichPackageShowResult` and `formatPackageShowMarkdown` as `CkanPackage`
- [x] 2.4 Remove inline `(tag: any)`, `(r: any)` etc. casts where now inferrable
- [x] 2.5 Build + test: `npm run build && npm test`

## 3. Replace `any` in datastore.ts
- [x] 3.1 Type field params as `CkanField` in field rendering closures
- [x] 3.2 Type result as `CkanDatastoreResult` where applicable
- [x] 3.3 Build + test

## 4. Replace `any` in organization.ts and group.ts
- [x] 4.1 Type org/facet items as `OrgFacetItem` (local type) in organization.ts
- [x] 4.2 Type group/facet items in `normalizeGroupFacets` in group.ts; `result: any` → `unknown`
- [x] 4.3 Build + test

## 5. Replace `any` in quality.ts
- [x] 5.1 Change `normalizeQualityData(data: any)` to `(data: unknown)`
- [x] 5.2 Change `formatQualityMarkdown(data: any, ...)` to `(data: unknown)`
- [x] 5.3 Build + test

## 6. Final validation
- [x] 6.1 Run `npm run build && npm test` — all green (244 passed)
- [x] 6.2 `any` count: before 32 → after 1 (internal `let result: any` in organization.ts handler, out of scope)
- [x] 6.3 Update LOG.md
