# dataworld-mcp

MCP server for data.world — search, query, and download public datasets from Claude Code.

## Commands

- Install: `npm install`
- Start: `npm start`
- Test: `npm test` (unit tests, mocked)
- Test E2E: `DW_AUTH_TOKEN=your_token npm run test:e2e` (hits real API)

## Structure

- `src/index.js` — MCP server entry point, tool definitions, dispatch
- `src/client.js` — data.world REST API client (implemented)
- `test/client.test.js` — unit tests with mocked axios
- `test/e2e.test.js` — end-to-end tests against live API

## Build Status

**Implemented.** All 6 tools built and unit-tested. E2E tests ready but require DW_AUTH_TOKEN.

## Auth

Requires `DW_AUTH_TOKEN` environment variable. Get token from data.world > Settings > Advanced > API Tokens.

## API Endpoints Used

- Search: `GET https://api.data.world/v0/search/datasets?q=&limit=`
- Get dataset: `GET https://api.data.world/v0/datasets/{owner}/{id}`
- List files: embedded in dataset metadata response
- SQL query: `POST https://query.data.world/sql/{owner}/{id}?query=`
- Download file: `GET https://api.data.world/v0/file_download/{owner}/{id}/{file}`
- List user datasets: `GET https://api.data.world/v0/datasets/{owner}?limit=`

## Tools Exposed

1. `dataworld_search_datasets` — keyword search across public datasets
2. `dataworld_get_dataset` — metadata for a specific dataset
3. `dataworld_list_files` — files in a dataset
4. `dataworld_query_sql` — SQL query against a dataset
5. `dataworld_download_file` — download file content (truncated for large files)
6. `dataworld_list_user_datasets` — list datasets by owner/org

## Remaining Work

- Get DW_AUTH_TOKEN and run E2E tests
- Create GitHub repo (DrakkoTarkin/dataworld-mcp)
- Publish to npm and MCP registries
- Add to Claude Code settings.json as MCP server
