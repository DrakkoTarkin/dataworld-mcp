# Changelog

All notable changes to dataworld-mcp will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org).

## [Unreleased]

## [0.1.1] - 2026-04-25

### Added
- LICENSE file (MIT)
- CHANGELOG.md
- GitHub Actions workflow for unit tests on push + PR
- README sections for troubleshooting, contribution, and registry registration
- `npm pack --dry-run` documented in publish flow

### Changed
- README expanded with full tool reference, example queries, and example Claude Code prompts

## [0.1.0] - 2026-04-22

### Added
- Initial release
- All 6 MCP tools: search_datasets, get_dataset, list_files, query_sql, download_file, list_user_datasets
- CLI wrapper (`dw`) for direct command-line usage
- Unit tests with mocked axios (9 passing)
- E2E test suite against the live data.world API (requires `DW_AUTH_TOKEN`)
