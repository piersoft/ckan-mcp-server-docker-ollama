# Change: Add detailed MQA quality tool

## Why
Users need to understand why an MQA dimension (especially reusability) is not at max without relying on external tools like curl.

## What Changes
- Add a dedicated MCP tool to fetch and summarize detailed MQA quality signals for a dataset from data.europa.eu.
- Provide a concise reason list for non-max dimensions (e.g., knownLicence=false).
- Support markdown and JSON outputs consistent with existing tools.

## Impact
- Affected specs: mqa-quality (new capability)
- Affected code: new tool handler in src/tools, server registration, tests
