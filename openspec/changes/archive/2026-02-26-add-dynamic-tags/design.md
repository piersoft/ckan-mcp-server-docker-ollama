## Context
We want to replace or complement static, curated tag lists with dynamic tag discovery from CKAN. The tool should return tag names with dataset counts, optionally filtered by dataset query, filter query, and a tag substring.

## Goals / Non-Goals
- Goals:
  - Retrieve tag counts dynamically from CKAN.
  - Support optional filtering (`q`, `fq`, `tag_query`) and a configurable limit.
  - Provide both markdown and JSON output, consistent with existing tools.
- Non-Goals:
  - No persistent storage or long-term caching.
  - No admin/authenticated CKAN endpoints.
  - No changes to CKAN data (read-only only).

## Decisions
- Use CKAN `package_search` with `facet.field=["tags"]` and `rows=0` to obtain tag counts.
- Normalize results to `{ name, count }` entries, sorted by count desc.
- Apply `tag_query` filtering client-side (case-insensitive substring) after facet retrieval.
- Limit results with `limit` (default 100, max 1000).
- Reuse existing response format utilities (`ResponseFormat`) to return markdown or JSON.

## Risks / Trade-offs
- Faceting can be expensive on large portals; mitigate with `rows=0` and `limit` caps.
- Tag counts reflect current index state and may lag behind real-time changes.
- Client-side filtering is less efficient than server-side tag search, but avoids non-standard CKAN extensions.

## Migration Plan
- Add the new tool alongside existing capabilities.
- Document usage and examples in README.
- Optional: deprecate static tag lists in documentation only after the new tool is proven stable.

## Open Questions
- Should we add optional caching/TTL for tag results?
- Should `tag_query` also support regex or prefix-only matching?
