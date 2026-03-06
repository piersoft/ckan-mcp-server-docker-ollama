import { describe, it, expect } from "vitest";
import datastoreSearchFixture from "../fixtures/responses/datastore-search-success.json";
import datastoreSqlFixture from "../fixtures/responses/datastore-search-sql-success.json";
import { formatDatastoreSearchMarkdown, formatDatastoreSqlMarkdown } from "../../src/tools/datastore";

const SERVER = "https://www.dati.gov.it/opendata";
const RESOURCE_ID = "res-1";

describe("formatDatastoreSearchMarkdown", () => {
  const result = datastoreSearchFixture.result;

  it("includes server, resource ID, total and returned counts", () => {
    const md = formatDatastoreSearchMarkdown(result, SERVER, RESOURCE_ID, 0, 100);
    expect(md).toContain(`**Server**: ${SERVER}`);
    expect(md).toContain(`**Resource ID**: \`${RESOURCE_ID}\``);
    expect(md).toContain(`**Total Records**: 3`);
    expect(md).toContain(`**Returned**: 3 records`);
  });

  it("renders ## Fields section with types", () => {
    const md = formatDatastoreSearchMarkdown(result, SERVER, RESOURCE_ID, 0, 100);
    expect(md).toContain("## Fields");
    expect(md).toContain("**_id** (int4)");
    expect(md).toContain("**name** (text)");
    expect(md).toContain("**value** (numeric)");
  });

  it("renders ## Records section without _id column", () => {
    const md = formatDatastoreSearchMarkdown(result, SERVER, RESOURCE_ID, 0, 100);
    expect(md).toContain("## Records");
    expect(md).not.toContain("| _id |");
    expect(md).toContain("| name | value | date |");
    expect(md).toContain("Record 1");
    expect(md).toContain("Record 2");
  });

  it("truncates cell values at 80 chars", () => {
    const longValue = "A".repeat(90);
    const resultWithLong = {
      ...result,
      records: [{ name: longValue, value: 1, date: "2024-01-01" }]
    };
    const md = formatDatastoreSearchMarkdown(resultWithLong, SERVER, RESOURCE_ID, 0, 100);
    expect(md).toContain("A".repeat(77) + "...");
    expect(md).not.toContain("A".repeat(80));
  });

  it("shows pagination hint when more results available", () => {
    const resultWithMore = { ...result, total: 200 };
    const md = formatDatastoreSearchMarkdown(resultWithMore, SERVER, RESOURCE_ID, 0, 100);
    expect(md).toContain("More results available");
    expect(md).toContain("offset: 100");
  });

  it("no pagination hint when all results returned", () => {
    const md = formatDatastoreSearchMarkdown(result, SERVER, RESOURCE_ID, 0, 100);
    expect(md).not.toContain("More results available");
  });
});

describe("formatDatastoreSqlMarkdown", () => {
  const result = datastoreSqlFixture.result;
  const SQL = `SELECT * FROM "res-1" LIMIT 10`;

  it("includes server, SQL and returned count", () => {
    const md = formatDatastoreSqlMarkdown(result, SERVER, SQL);
    expect(md).toContain(`**Server**: ${SERVER}`);
    expect(md).toContain(`**SQL**: \`${SQL}\``);
    expect(md).toContain("**Returned**: 2 records");
  });

  it("renders ## Fields section", () => {
    const md = formatDatastoreSqlMarkdown(result, SERVER, SQL);
    expect(md).toContain("## Fields");
    expect(md).toContain("**country** (text)");
    expect(md).toContain("**total** (int4)");
  });

  it("renders ## Records table with data", () => {
    const md = formatDatastoreSqlMarkdown(result, SERVER, SQL);
    expect(md).toContain("## Records");
    expect(md).toContain("Italy");
    expect(md).toContain("France");
  });

  it("shows no-records message when empty", () => {
    const emptyResult = { fields: [], records: [] };
    const md = formatDatastoreSqlMarkdown(emptyResult, SERVER, SQL);
    expect(md).toContain("No records returned by the SQL query.");
  });
});
