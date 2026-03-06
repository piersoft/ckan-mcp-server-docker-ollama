# MCP Guided Prompts

This document lists the guided MCP prompts provided by the server and how to use them.

## Available prompts

- `ckan-search-by-theme`
- `ckan-search-by-organization`
- `ckan-search-by-format`
- `ckan-recent-datasets`
- `ckan-analyze-dataset`

## Example usage

### Search by theme

```json
{
  "name": "ckan-search-by-theme",
  "arguments": {
    "server_url": "https://www.dati.gov.it/opendata",
    "theme": "ambiente",
    "rows": 10
  }
}
```

### Analyze a dataset

```json
{
  "name": "ckan-analyze-dataset",
  "arguments": {
    "server_url": "https://demo.ckan.org",
    "id": "my-dataset"
  }
}
```
