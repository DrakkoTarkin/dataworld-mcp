#!/usr/bin/env node

import { DataWorldClient } from "./client.js";

const client = new DataWorldClient();

const USAGE = `Usage: dw <command> [args] [--json]

Commands:
  search <query> [--limit N]              Search datasets
  get <owner> <dataset>                   Get dataset details
  list-files <owner> <dataset>            List files in a dataset
  query <owner> <dataset> "<sql>"         Run SQL query
  download <owner> <dataset> <file>       Download a file (first 500 rows)
  list-datasets <owner> [--limit N]       List user's datasets

Options:
  --json     Output raw JSON (default: formatted text)
  --limit N  Limit results (default: 10 for search, 20 for list-datasets)
`;

function parseArgs(argv) {
  const args = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") {
      flags.json = true;
    } else if (argv[i] === "--limit" && argv[i + 1]) {
      flags.limit = parseInt(argv[++i], 10);
    } else {
      args.push(argv[i]);
    }
  }
  return { args, flags };
}

function output(data, json) {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function main() {
  const { args, flags } = parseArgs(process.argv.slice(2));
  const command = args[0];

  if (!command || command === "help" || command === "--help") {
    console.log(USAGE);
    process.exit(0);
  }

  try {
    switch (command) {
      case "search": {
        if (!args[1]) { console.error("Usage: dw search <query>"); process.exit(1); }
        const results = await client.searchDatasets(args[1], flags.limit || 10);
        output(results, flags.json);
        break;
      }
      case "get": {
        if (!args[1] || !args[2]) { console.error("Usage: dw get <owner> <dataset>"); process.exit(1); }
        const dataset = await client.getDataset(args[1], args[2]);
        output(dataset, flags.json);
        break;
      }
      case "list-files": {
        if (!args[1] || !args[2]) { console.error("Usage: dw list-files <owner> <dataset>"); process.exit(1); }
        const files = await client.listFiles(args[1], args[2]);
        output(files, flags.json);
        break;
      }
      case "query": {
        if (!args[1] || !args[2] || !args[3]) { console.error("Usage: dw query <owner> <dataset> \"<sql>\""); process.exit(1); }
        const rows = await client.querySql(args[1], args[2], args[3]);
        output(rows, flags.json);
        break;
      }
      case "download": {
        if (!args[1] || !args[2] || !args[3]) { console.error("Usage: dw download <owner> <dataset> <file>"); process.exit(1); }
        const file = await client.downloadFile(args[1], args[2], args[3]);
        output(file, flags.json);
        break;
      }
      case "list-datasets": {
        if (!args[1]) { console.error("Usage: dw list-datasets <owner>"); process.exit(1); }
        const datasets = await client.listUserDatasets(args[1], flags.limit || 20);
        output(datasets, flags.json);
        break;
      }
      default:
        console.error(`Unknown command: ${command}\n`);
        console.log(USAGE);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
