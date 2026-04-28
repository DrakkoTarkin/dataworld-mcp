# dataworld-mcp

MCP server for [data.world](https://data.world). Search, query, and download public datasets directly from Claude Code (or any MCP-compatible client).

[![test](https://github.com/DrakkoTarkin/dataworld-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/DrakkoTarkin/dataworld-mcp/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/dataworld-mcp.svg)](https://www.npmjs.com/package/dataworld-mcp)
[![license](https://img.shields.io/npm/l/dataworld-mcp.svg)](https://github.com/DrakkoTarkin/dataworld-mcp/blob/main/LICENSE)

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

After saving the config, restart Claude Code. The server will appear in `/mcp` and the six tools below become callable.

## Auth

1. Sign in at [data.world](https://data.world).
2. Open [data.world settings -> Advanced -> API Tokens](https://data.world/settings/advanced).
3. Generate a personal token. Read access is sufficient for query and download.
4. Set `DW_AUTH_TOKEN` environment variable, either in the MCP config block above or in your shell.

The token is read at startup. If absent, the server still starts but every API call returns an authentication error.

## Tools

| Tool | Description | Required args |
|------|-------------|---------------|
| `dataworld_search_datasets` | Search for datasets by keyword | `query` |
| `dataworld_get_dataset` | Get dataset metadata (description, files, tags, license) | `owner`, `id` |
| `dataworld_list_files` | List files in a dataset | `owner`, `id` |
| `dataworld_query_sql` | Run a SQL query against a dataset | `owner`, `id`, `query` |
| `dataworld_download_file` | Download a file (first 500 rows for CSV/XLSX) | `owner`, `id`, `file` |
| `dataworld_list_user_datasets` | List datasets owned by a user or org | `owner` |

## Example Claude Code prompts

Once the MCP is wired in, prompts like these route to the right tool automatically:

```
Search data.world for COVID hospitalization datasets and show me the top 5.

Get the metadata for makeovermonday/2016w51 and list the files.

Run this query against makeovermonday/2016w51 and return 10 rows:
SELECT * FROM dc_metro_scorecard ORDER BY year DESC

Download the first 100 rows of "DC Metro Scorecard.xlsx" from makeovermonday/2016w51.
```

## CLI

A CLI is also bundled for direct terminal use without the MCP layer:

```bash
node src/cli.js search "covid" --limit 5
node src/cli.js get makeovermonday 2016w51
node src/cli.js list-files makeovermonday 2016w51
node src/cli.js query makeovermonday 2016w51 "SELECT * FROM dc_metro_scorecard LIMIT 10"
node src/cli.js download makeovermonday 2016w51 "DC Metro Scorecard.xlsx"
node src/cli.js list-datasets makeovermonday --limit 20
```

Append `--json` for structured output suitable for piping into `jq`.

## Development

```bash
git clone https://github.com/DrakkoTarkin/dataworld-mcp.git
cd dataworld-mcp
npm install
npm test                          # 9 unit tests with mocked HTTP
DW_AUTH_TOKEN=xxx npm run test:e2e # 7 end-to-end tests against the live API
npm run lint
```

## Publishing

```bash
npm pack --dry-run                # inspect the tarball without publishing
npm version patch                 # bump 0.1.0 -> 0.1.1
npm publish --access public
git push --follow-tags
```

## Troubleshooting

**"Authentication required" on every call**
- Verify `DW_AUTH_TOKEN` is set in the same environment Claude Code launches from. On Windows, set in System Properties -> Environment Variables, then restart Claude Code.

**"Dataset not found" on a public dataset**
- Use the URL slug, not the display name. For `https://data.world/makeovermonday/2016w51` the owner is `makeovermonday` and the id is `2016w51`.

**SQL query returns 400**
- data.world auto-creates table names from filenames by lowercasing and replacing spaces with underscores. `DC Metro Scorecard.xlsx` becomes table `dc_metro_scorecard`. Inspect the dataset metadata first via `dataworld_get_dataset` to see exact table names.

**Large files time out**
- The download tool truncates to 500 rows by default. Pass `maxRows` to extend, or download via data.world's web UI for full files.

## Contributing

Issues and PRs welcome. Please run `npm test` and `npm run lint` before submitting. New tools should ship with both unit (mocked) and E2E test coverage.

## Requirements

- Node.js >= 18
- data.world API token

## License

[MIT](./LICENSE)
