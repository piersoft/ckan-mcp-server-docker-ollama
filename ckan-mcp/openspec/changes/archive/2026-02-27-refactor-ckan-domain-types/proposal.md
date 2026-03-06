# Change: Add CKAN domain types to replace `any` in tool handlers

## Why

Tool handler functions in `src/tools/` use `any` for CKAN API response shapes (56 occurrences across 7 files). This means contributors can introduce shape mismatches between fixture data and handler logic with no compile-time feedback. As the contributor base grows, this is the highest-risk gap for silent regressions.

## What Changes

- Add CKAN domain types to `src/types.ts`: `CkanTag`, `CkanResource`, `CkanPackage`, `CkanOrganization`, `CkanField`, `CkanDatastoreResult`
- Replace `any` in exported functions in `package.ts` (`scoreDatasetRelevance`, `enrichPackageShowResult`, `formatPackageShowMarkdown`, `parseAccessServices`, `resolveDownloadUrl`)
- Replace `any` in exported functions in `datastore.ts` (field/record shapes) once rendered as exported function
- Replace `any` in `organization.ts` facet/org shapes
- Replace `any` in `group.ts` normalizeGroupFacets
- Replace `any` in `quality.ts` `normalizeQualityData` and `formatQualityMarkdown` input shapes
- No behavioral change — pure type safety refactor

## Impact

- Affected specs: new capability `ckan-domain-types`
- Affected code: `src/types.ts`, `src/tools/package.ts`, `src/tools/datastore.ts`, `src/tools/organization.ts`, `src/tools/group.ts`, `src/tools/quality.ts`
- No breaking changes to MCP tool interfaces or runtime behavior
- Tests unchanged (types are erased at runtime)
