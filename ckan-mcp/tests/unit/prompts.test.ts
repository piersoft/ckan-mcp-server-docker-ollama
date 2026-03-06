import { describe, it, expect } from "vitest";
import { buildThemePromptText } from "../../src/prompts/theme.js";
import { buildOrganizationPromptText } from "../../src/prompts/organization.js";
import { buildFormatPromptText } from "../../src/prompts/format.js";
import { buildRecentPromptText } from "../../src/prompts/recent.js";
import { buildDatasetAnalysisPromptText } from "../../src/prompts/dataset-analysis.js";

describe("MCP guided prompts", () => {
  it("builds theme prompt with expected tool calls", () => {
    const text = buildThemePromptText("https://demo.ckan.org", "environment", 12);

    expect(text).toContain("ckan_group_search");
    expect(text).toContain("ckan_package_search");
    expect(text).toContain("server_url");
    expect(text).toContain("pattern");
    expect(text).toContain("rows: 12");
  });

  it("builds organization prompt with facet discovery", () => {
    const text = buildOrganizationPromptText("https://demo.ckan.org", "health", 8);

    expect(text).toContain("organization:*health*");
    expect(text).toContain("facet_field");
    expect(text).toContain("fq: \"organization:<org-id>\"");
    expect(text).toContain("rows: 8");
  });

  it("builds format prompt with res_format filter", () => {
    const text = buildFormatPromptText("https://demo.ckan.org", "CSV", 5);

    expect(text).toContain("res_format:CSV");
    expect(text).toContain("rows: 5");
  });

  it("builds recent prompt with sort and optional date filter", () => {
    const text = buildRecentPromptText("https://demo.ckan.org", 15);

    expect(text).toContain("metadata_modified desc");
    expect(text).toContain("NOW-30DAYS");
    expect(text).toContain("rows: 15");
  });

  it("builds dataset analysis prompt with resource and datastore steps", () => {
    const text = buildDatasetAnalysisPromptText("https://demo.ckan.org", "my-dataset");

    expect(text).toContain("ckan_package_show");
    expect(text).toContain("ckan_resource_show");
    expect(text).toContain("ckan_datastore_search");
    expect(text).toContain("ckan_datastore_search_sql");
  });
});
