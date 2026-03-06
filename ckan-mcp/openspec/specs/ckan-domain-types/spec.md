# ckan-domain-types Specification

## Purpose
TBD - created by archiving change refactor-ckan-domain-types. Update Purpose after archive.
## Requirements
### Requirement: CKAN Domain Types
The system SHALL define shared TypeScript types for common CKAN API response shapes in `src/types.ts` so that tool handler code is type-safe at compile time.

Types defined: `CkanTag`, `CkanResource`, `CkanPackage`, `CkanOrganization`, `CkanField`, `CkanDatastoreResult`.

Each type SHALL include only fields actively accessed in tool handler code, with an index signature `[key: string]: unknown` for unknown portal-specific extra fields. Optional fields SHALL use `?` rather than union types.

#### Scenario: Exported tool function uses domain type
- **WHEN** a contributor calls `formatPackageShowMarkdown(result, serverUrl)` with a shape missing the `title` field
- **THEN** the TypeScript compiler emits an error before the code runs

#### Scenario: Index signature allows portal-specific fields
- **WHEN** a CKAN portal returns extra undocumented fields in a package response
- **THEN** the type assignment does not produce a compile error

### Requirement: Replace `any` in Exported Tool Functions
Tool handler exported functions in `src/tools/package.ts`, `src/tools/datastore.ts`, `src/tools/organization.ts`, `src/tools/group.ts`, and `src/tools/quality.ts` SHALL use the domain types from `src/types.ts` instead of `any` for CKAN API response parameters.

Inline `any` casts within closures (e.g. array `.map((item: any) => ...)`) SHALL be replaced where the item type is inferrable from the parent typed variable.

#### Scenario: scoreDatasetRelevance receives typed dataset
- **WHEN** `scoreDatasetRelevance(query, dataset, weights)` is called
- **THEN** `dataset` is typed as `CkanPackage`, not `any`

#### Scenario: formatPackageShowMarkdown receives typed result
- **WHEN** `formatPackageShowMarkdown(result, serverUrl)` is called
- **THEN** `result` is typed as `CkanPackage`, not `any`

#### Scenario: CkanField used in datastore rendering
- **WHEN** `result.fields.map((f: CkanField) => ...)` iterates fields
- **THEN** accessing `f.id` and `f.type` is type-safe without casts

#### Scenario: quality.ts raw API input remains loosely typed
- **WHEN** `normalizeQualityData(data)` receives a raw MQA API response
- **THEN** the input parameter is typed as `unknown` (not `any`) and the function narrows it internally

