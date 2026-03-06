# ckan-insights Specification

## Purpose
Describe dataset insight tools (relevance, freshness, structure) once implemented.
## Requirements
### Requirement: Insights capability reserved
The system SHALL maintain this specification to document dataset insight tools when they are added.

#### Scenario: Insight tools documented
- **WHEN** new insight tools are implemented
- **THEN** their requirements are captured in this specification

### Requirement: Find relevant datasets
The system SHALL provide a `ckan_find_relevant_datasets` tool that accepts `server_url`, `query`, `limit`, optional weights for title, notes, tags, and organization, and an optional search parser override, and returns the top N datasets ranked by score with a per-field score breakdown.

#### Scenario: Ranked results returned
- **WHEN** the tool is invoked with a query and limit
- **THEN** the system uses `package_search` results to return the top N datasets with numeric scores and field contributions

#### Scenario: Search parser override applied
- **WHEN** the tool is invoked with a search parser override
- **THEN** the system applies the override to the underlying `package_search` query

### Requirement: MQA output references metrics details
The system SHALL include a guidance note in MQA quality responses indicating that the metrics endpoint can be used to explain score deductions.

#### Scenario: User asks why a score is not maximum
- **WHEN** the user asks for reasons a dataset does not have the maximum MQA score
- **THEN** the system uses the metrics endpoint to identify failing measurements (e.g., boolean metrics with false values)
- **AND** the response cites the relevant failing measurement(s) as the cause of the deduction

