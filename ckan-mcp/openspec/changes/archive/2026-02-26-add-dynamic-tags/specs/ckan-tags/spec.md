## ADDED Requirements
### Requirement: Dynamic tag discovery tool
The system SHALL provide a `ckan_tag_list` tool that accepts `server_url`, optional dataset query filters (`q` and `fq`), optional `tag_query`, optional `limit`, and `response_format`, and returns tag names with dataset counts derived from CKAN faceting (not from static configuration).

#### Scenario: List top tags for a portal
- **WHEN** the client calls `ckan_tag_list` with `server_url` and no filters
- **THEN** the system returns tag names with counts from CKAN facet data in the requested response format

### Requirement: Tag filtering by substring
The system SHALL filter the returned tag list by `tag_query` (case-insensitive substring match) when provided, and return at most `limit` tags.

#### Scenario: Filter tags by keyword
- **WHEN** the client calls `ckan_tag_list` with `tag_query="water"` and `limit=20`
- **THEN** the system returns up to 20 tags whose names include "water" along with their dataset counts
