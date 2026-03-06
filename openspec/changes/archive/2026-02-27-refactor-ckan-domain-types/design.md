# Design: CKAN Domain Types

## Context

`src/types.ts` currently holds only `ResponseFormat`, `ResponseFormatSchema`, and `CHARACTER_LIMIT`. All CKAN API response shapes are typed as `any` in tool handlers. Quality-specific types (MqaDimension, NormalizedQualityData, etc.) are already well-defined locally in `quality.ts` and should stay there — they are portal-specific, not generic CKAN shapes.

## Goals / Non-Goals

- **Goals**: define minimal shared CKAN API shapes; replace `any` in exported/public tool functions; enable compile-time safety for contributors
- **Non-Goals**: exhaustive CKAN API type coverage; typed Zod schemas for CKAN responses; changes to runtime behavior; MQA-specific types (already typed in quality.ts)

## Decisions

- **Where**: all new types go in `src/types.ts` (single source of truth, already imported by all tool files)
- **Scope**: only fields actually accessed in code — keep types minimal, not exhaustive. Unknown extra fields use index signatures (`[key: string]: unknown`) rather than `any`
- **Partial types**: use `?` for optional fields (e.g. `display_name?`) rather than unions to keep types readable
- **No Zod**: runtime validation of CKAN responses is intentionally absent (CKAN portals vary); types are compile-time only
- **quality.ts local types**: leave untouched — they model MQA-specific domain, not generic CKAN shapes

## Core Types to Define

```
CkanTag          { id?: string; name: string; display_name?: string }
CkanResource     { id: string; name?: string; url?: string; format?: string;
                   mimetype?: string; size?: number; created?: string;
                   last_modified?: string; datastore_active?: boolean;
                   access_services?: string; [key: string]: unknown }
CkanPackage      { id: string; name: string; title?: string; notes?: string;
                   metadata_created?: string; metadata_modified?: string;
                   organization?: { name: string; title?: string };
                   tags?: CkanTag[]; resources?: CkanResource[];
                   [key: string]: unknown }
CkanOrganization { id: string; name: string; title?: string;
                   description?: string; image_url?: string;
                   package_count?: number; [key: string]: unknown }
CkanField        { id: string; type: string }
CkanDatastoreResult { resource_id?: string; fields: CkanField[];
                      records: Record<string, unknown>[];
                      total?: number; [key: string]: unknown }
```

## Risks / Trade-offs

- CKAN portals vary in response shape — index signatures (`[key: string]: unknown`) prevent false compile errors on portal-specific extra fields
- If a portal returns a field with a wrong type (e.g. `size` as string), TypeScript will not catch it at runtime — this is acceptable given the no-Zod decision

## Open Questions

- Should `CkanPackage` include a `score?: number` field (added by Solr search results)? → Yes, as optional field on the type.
