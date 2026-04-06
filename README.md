# dataworld-mcp

MCP server for [data.world](https://data.world) — search, query, and download public datasets from Claude Code.

## Install

```bash
npx dataworld-mcp
```

Or add to your Claude Code MCP config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "dataworld": {
      "type": "stdio",
      "command": "npx",
      "args": ["dataworld-mcp"],
      "env": {
        "DW_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Auth

Get your API token from [data.world settings](https://data.world/settings/advanced). Set it as `DW_AUTH_TOKEN` environment variable.

## Tools

| Tool | Description |
|------|-------------|
| `dataworld_search_datasets` | Search for datasets by keyword |
| `dataworld_get_dataset` | Get dataset metadata (description, files, tags) |
| `dataworld_list_files` | List files in a dataset |
| `dataworld_query_sql` | Run SQL queries against a dataset |
| `dataworld_download_file` | Download a file (first 500 rows for CSV) |
| `dataworld_list_user_datasets` | List datasets owned by a user |

## CLI

A CLI is also included for direct terminal use:

```bash
node src/cli.js search "covid" --limit 5
node src/cli.js query makeovermonday 2026w13-ai-workslop "SELECT * FROM tables"
node src/cli.js get <owner> <dataset>
node src/cli.js list-files <owner> <dataset>
node src/cli.js download <owner> <dataset> <file>
node src/cli.js list-datasets <owner> --limit 20
```

Add `--json` for structured output.

## Requirements

- Node.js >= 18
- data.world API token

## License

MIT
