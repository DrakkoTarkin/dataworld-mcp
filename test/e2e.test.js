import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

/**
 * End-to-end validation tests for data.world MCP server.
 *
 * These tests hit the real data.world API. They require:
 * - DW_AUTH_TOKEN environment variable set
 * - Network access to api.data.world
 *
 * Run: DW_AUTH_TOKEN=your_token npm run test:e2e
 */

let DataWorldClient;

before(async () => {
  if (!process.env.DW_AUTH_TOKEN) {
    console.warn(
      "WARNING: DW_AUTH_TOKEN not set. E2E tests will fail on auth-required endpoints."
    );
  }
  const mod = await import("../src/client.js");
  DataWorldClient = mod.DataWorldClient;
});

// Known good dataset: makeovermonday/2016w51 (DC Metro Scorecard, has 1 xlsx file)
const TEST_OWNER = "makeovermonday";
const TEST_DATASET = "2016w51";

describe("E2E: Search", () => {
  it("should return results for a common search term", async () => {
    const client = new DataWorldClient();
    const results = await client.searchDatasets("covid", 5);
    assert.ok(Array.isArray(results), "results should be an array");
    assert.ok(results.length > 0, "should find at least one dataset");
    assert.ok(results[0].title, "each result should have a title");
    assert.ok(results[0].owner, "each result should have an owner");
  });
});

describe("E2E: Get Dataset", () => {
  it("should retrieve metadata for a known public dataset", async () => {
    const client = new DataWorldClient();
    const dataset = await client.getDataset(TEST_OWNER, TEST_DATASET);
    assert.ok(dataset, "dataset should not be null");
    assert.ok(
      dataset.title || dataset.id,
      "dataset should have a title or id"
    );
    assert.ok(dataset.files, "dataset should have files array");
  });
});

describe("E2E: List Files", () => {
  it("should list files in a known dataset", async () => {
    const client = new DataWorldClient();
    const files = await client.listFiles(TEST_OWNER, TEST_DATASET);
    assert.ok(Array.isArray(files), "files should be an array");
    assert.ok(files.length > 0, "dataset should have at least one file");
    assert.ok(files[0].name, "file should have a name");
  });
});

describe("E2E: SQL Query", () => {
  it("should execute a SQL query against a dataset table", async () => {
    const client = new DataWorldClient();
    // Use a known table from the dataset — data.world auto-creates tables from files
    const result = await client.querySql(
      TEST_OWNER,
      TEST_DATASET,
      "SELECT * FROM dc_metro_scorecard LIMIT 5"
    );
    assert.ok(result, "query should return results");
    assert.ok(Array.isArray(result), "result should be an array of rows");
    assert.ok(result.length > 0, "should have at least one row");
  });
});

describe("E2E: Download File", () => {
  it("should download file content", async () => {
    const client = new DataWorldClient();
    const content = await client.downloadFile(
      TEST_OWNER,
      TEST_DATASET,
      "DC Metro Scorecard.xlsx",
      10
    );
    assert.ok(content, "should return file content");
    assert.ok(
      content.content !== undefined,
      "result should have content field"
    );
  });
});

describe("E2E: List User Datasets", () => {
  it("should list datasets for makeovermonday account", async () => {
    const client = new DataWorldClient();
    const datasets = await client.listUserDatasets(TEST_OWNER, 5);
    assert.ok(Array.isArray(datasets), "should return an array");
    assert.ok(datasets.length > 0, "makeovermonday should have datasets");
    assert.ok(datasets[0].id, "each dataset should have an id");
  });
});

describe("E2E: Full Pipeline", () => {
  it("should search -> get metadata -> list files in sequence", async () => {
    const client = new DataWorldClient();

    // Step 1: Search
    const searchResults = await client.searchDatasets("sales", 3);
    assert.ok(searchResults.length > 0, "search should return results");

    // Step 2: Get first result's metadata
    const first = searchResults[0];
    const metadata = await client.getDataset(first.owner, first.id);
    assert.ok(metadata, "should get dataset metadata");

    // Step 3: List files
    const files = await client.listFiles(first.owner, first.id);
    assert.ok(Array.isArray(files), "should get files list");
  });
});
