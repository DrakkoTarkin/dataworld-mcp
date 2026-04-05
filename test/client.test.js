import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

const mockGet = mock.fn();
const mockPost = mock.fn();

mock.module("axios", {
  namedExports: {},
  defaultExport: {
    create: () => ({ get: mockGet, post: mockPost }),
  },
});

const { DataWorldClient } = await import("../src/client.js");

describe("DataWorldClient", () => {
  let client;

  beforeEach(() => {
    process.env.DW_AUTH_TOKEN = "test-token";
    mockGet.mock.resetCalls();
    mockPost.mock.resetCalls();
    client = new DataWorldClient();
  });

  describe("searchDatasets", () => {
    it("returns mapped results from API response", async () => {
      mockPost.mock.mockImplementation(async () => ({
        data: {
          records: [
            {
              id: "test-ds",
              title: "Test Dataset",
              owner: "testuser",
              description: "A test",
              resourceLink: "https://data.world/testuser/test-ds",
              tags: ["demo"],
              updated: "2026-01-01",
            },
          ],
        },
      }));

      const results = await client.searchDatasets("test", 5);
      assert.equal(results.length, 1);
      assert.equal(results[0].id, "test-ds");
      assert.equal(results[0].title, "Test Dataset");
      assert.equal(results[0].owner, "testuser");
      assert.equal(
        results[0].url,
        "https://data.world/testuser/test-ds"
      );
    });

    it("caps limit at 50", async () => {
      const many = Array.from({ length: 60 }, (_, i) => ({
        id: `ds-${i}`,
        title: `DS ${i}`,
        owner: "o",
      }));
      mockPost.mock.mockImplementation(async () => ({
        data: { records: many },
      }));
      const results = await client.searchDatasets("test", 100);
      assert.equal(results.length, 50);
    });

    it("returns empty array for non-array response", async () => {
      mockPost.mock.mockImplementation(async () => ({
        data: { message: "no results" },
      }));
      const results = await client.searchDatasets("nothing");
      assert.deepEqual(results, []);
    });
  });

  describe("getDataset", () => {
    it("returns formatted dataset metadata", async () => {
      mockGet.mock.mockImplementation(async () => ({
        data: {
          id: "ds1",
          title: "My Dataset",
          owner: "alice",
          description: "desc",
          tags: ["tag1"],
          visibility: "OPEN",
          files: [{ name: "data.csv", sizeInBytes: 1024 }],
        },
      }));

      const ds = await client.getDataset("alice", "ds1");
      assert.equal(ds.id, "ds1");
      assert.equal(ds.title, "My Dataset");
      assert.equal(ds.files.length, 1);
      assert.equal(ds.files[0].name, "data.csv");
      assert.equal(ds.files[0].size, 1024);
    });
  });

  describe("listFiles", () => {
    it("returns files from dataset metadata", async () => {
      mockGet.mock.mockImplementation(async () => ({
        data: {
          id: "ds1",
          owner: "bob",
          files: [
            { name: "a.csv", sizeInBytes: 100 },
            { name: "b.json", sizeInBytes: 200 },
          ],
        },
      }));

      const files = await client.listFiles("bob", "ds1");
      assert.equal(files.length, 2);
      assert.equal(files[0].name, "a.csv");
      assert.equal(files[1].name, "b.json");
    });
  });

  describe("querySql", () => {
    it("sends GET to query.data.world and returns data", async () => {
      mockGet.mock.mockImplementation(async (url) => {
        assert.ok(url.includes("query.data.world/sql/owner/ds"));
        return { data: [{ col1: "val1" }] };
      });

      const result = await client.querySql(
        "owner",
        "ds",
        "SELECT * FROM t LIMIT 1"
      );
      assert.deepEqual(result, [{ col1: "val1" }]);
    });
  });

  describe("downloadFile", () => {
    it("returns full content for small files", async () => {
      mockGet.mock.mockImplementation(async () => ({
        data: "header\nrow1\nrow2",
      }));

      const result = await client.downloadFile("o", "d", "f.csv");
      assert.equal(result.truncated, false);
      assert.ok(result.content.includes("header"));
    });

    it("truncates large files to maxRows", async () => {
      const lines = ["header"];
      for (let i = 0; i < 600; i++) lines.push(`row${i}`);
      mockGet.mock.mockImplementation(async () => ({
        data: lines.join("\n"),
      }));

      const result = await client.downloadFile("o", "d", "f.csv", 10);
      assert.equal(result.truncated, true);
      assert.equal(result.returnedRows, 10);
      assert.equal(result.totalRows, 600);
    });
  });

  describe("listUserDatasets", () => {
    it("returns mapped user dataset list", async () => {
      mockGet.mock.mockImplementation(async () => ({
        data: {
          records: [
            {
              id: "ds1",
              title: "DS One",
              owner: "org1",
              description: "first",
            },
            {
              id: "ds2",
              title: "DS Two",
              owner: "org1",
              description: "second",
            },
          ],
        },
      }));

      const datasets = await client.listUserDatasets("org1", 5);
      assert.equal(datasets.length, 2);
      assert.equal(datasets[0].id, "ds1");
      assert.equal(datasets[1].url, "https://data.world/org1/ds2");
    });
  });
});
