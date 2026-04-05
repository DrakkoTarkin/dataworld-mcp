#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DataWorldClient } from "./client.js";

const TOOLS = [
  {
    name: "dataworld_search_datasets",
    description:
      "Search data.world for public datasets by keyword. Returns dataset titles, descriptions, owners, and URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: {
          type: "number",
          description: "Max results (default 10, max 50)",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "dataworld_get_dataset",
    description:
      "Get metadata for a specific dataset including schema, description, files, and tags.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Dataset owner username" },
        dataset: { type: "string", description: "Dataset ID/slug" },
      },
      required: ["owner", "dataset"],
    },
  },
  {
    name: "dataworld_list_files",
    description: "List all files in a dataset with names, sizes, and types.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Dataset owner username" },
        dataset: { type: "string", description: "Dataset ID/slug" },
      },
      required: ["owner", "dataset"],
    },
  },
  {
    name: "dataworld_query_sql",
    description:
      "Run a SQL query against a dataset. Returns tabular results as JSON.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Dataset owner username" },
        dataset: { type: "string", description: "Dataset ID/slug" },
        query: { type: "string", description: "SQL query string" },
      },
      required: ["owner", "dataset", "query"],
    },
  },
  {
    name: "dataworld_download_file",
    description:
      "Download a specific file from a dataset. Returns the file content (CSV, JSON, etc.) truncated to first 500 rows for large files.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Dataset owner username" },
        dataset: { type: "string", description: "Dataset ID/slug" },
        file: { type: "string", description: "Filename to download" },
        max_rows: {
          type: "number",
          description: "Max rows to return (default 500)",
          default: 500,
        },
      },
      required: ["owner", "dataset", "file"],
    },
  },
  {
    name: "dataworld_list_user_datasets",
    description:
      "List all datasets owned by a specific user or organization.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Username or organization to list datasets for",
        },
        limit: {
          type: "number",
          description: "Max results (default 20)",
          default: 20,
        },
      },
      required: ["owner"],
    },
  },
];

class DataWorldMCPServer {
  constructor() {
    this.client = new DataWorldClient();
    this.server = new Server(
      { name: "dataworld-mcp", version: "0.1.0" },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.dispatch(name, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async dispatch(toolName, args) {
    switch (toolName) {
      case "dataworld_search_datasets":
        return this.client.searchDatasets(args.query, args.limit);
      case "dataworld_get_dataset":
        return this.client.getDataset(args.owner, args.dataset);
      case "dataworld_list_files":
        return this.client.listFiles(args.owner, args.dataset);
      case "dataworld_query_sql":
        return this.client.querySql(args.owner, args.dataset, args.query);
      case "dataworld_download_file":
        return this.client.downloadFile(
          args.owner,
          args.dataset,
          args.file,
          args.max_rows
        );
      case "dataworld_list_user_datasets":
        return this.client.listUserDatasets(args.owner, args.limit);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new DataWorldMCPServer();
server.run().catch(console.error);
