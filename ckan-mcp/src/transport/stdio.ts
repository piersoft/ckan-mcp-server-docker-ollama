/**
 * Transport: stdio
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export async function runStdio(server: McpServer) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CKAN MCP server running on stdio");
}
