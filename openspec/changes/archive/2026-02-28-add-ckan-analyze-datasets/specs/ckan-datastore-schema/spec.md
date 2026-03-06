# Spec: ckan-datastore-schema

## ADDED Requirements

### Requirement: `ckan_analyze_datasets` tool exists and returns dataset + schema info

The MCP server MUST expose a `ckan_analyze_datasets` tool that searches datasets and returns,
for each DataStore-enabled resource, the full field schema including record count.

#### Scenario: Basic search with DataStore resources
Given a CKAN server with DataStore-enabled resources,
When `ckan_analyze_datasets` is called with `server_url` and `q`,
Then the response lists datasets found, and for each DataStore resource includes:
- field names and types
- record count (total)
- `label` and `notes` when present in `info`

#### Scenario: Portal without DataStore Dictionary
Given a CKAN portal where `info` is absent from field metadata,
When `ckan_analyze_datasets` is called,
Then the response still lists field `id` and `type` without label/notes (no error).

#### Scenario: Dataset without DataStore resources
Given a dataset where no resource has `datastore_active=true`,
When `ckan_analyze_datasets` is called,
Then that dataset is listed with its non-DataStore resources (name + format) and no schema section.

### Requirement: `rows` parameter MUST limit datasets inspected

The `rows` parameter (default 5, max 20) MUST limit the number of datasets returned by `package_search`
and thus the number of `datastore_search?limit=0` calls made.

#### Scenario: Default rows
Given no `rows` parameter is provided,
When `ckan_analyze_datasets` is called,
Then at most 5 datasets are inspected.

#### Scenario: Custom rows
Given `rows=10`,
When `ckan_analyze_datasets` is called,
Then at most 10 datasets are inspected.
