# mqa-quality Specification

## Purpose
TBD - created by archiving change add-mqa-quality-details-tool. Update Purpose after archive.
## Requirements
### Requirement: MQA quality details tool
The system SHALL provide an MCP tool that returns a detailed MQA quality breakdown for a dataset using data.europa.eu MQA APIs without requiring external tooling.

#### Scenario: Markdown summary with non-max reasons
- **WHEN** the user requests details for dataset id `ocds-appalti-ordinari-2018` with format `markdown`
- **THEN** the tool returns dimension scores and lists non-max reasons (e.g., `knownLicence=false` under reusability)

#### Scenario: JSON structured output
- **WHEN** the user requests details for any dataset id with format `json`
- **THEN** the tool returns a structured payload including raw MQA flags and derived reasons

