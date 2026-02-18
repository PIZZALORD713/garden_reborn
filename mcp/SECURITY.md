# SECURITY.md

## Principles
- Least privilege by default.
- Read-only external requests unless explicitly expanded.
- Tight allowlists for remote hosts.
- No secrets returned in tool output.

## Current controls
- `validate_asset.glbUrl` only permits `https://` URLs.
- Optional host allowlist via `FRIENEMIES_ALLOWED_HOSTS` (comma-separated).
- Response payloads are structured and sanitized.
- No filesystem write/delete tools.

## Operational guidance
- Run MCP with dedicated service credentials.
- Rotate credentials regularly.
- Log requests/results for audit.
