"""NOT DOC CODE — the bridge from the page's tool schema to the adapter.

The Tool Call Rendering page shows `run_with_claude_agent_sdk` handing tool
schemas to `_build_sdk_tools` / `_make_sdk_tool`, which wrap each schema with
`claude_agent_sdk.tool` and serve them from `create_sdk_mcp_server`, passed to
`ClaudeAgentAdapter` through `mcp_servers` plus `allowed_tools`. The page never
defines `execute_tool` or the server-name constants, so this file is the
smallest version of that same wiring for the one published tool:

  - `tool(name, description, input_schema)` takes the page's JSON Schema as is.
  - The server is named `weather`; Claude sees `mcp__weather__get_weather`.
    `permission_mode: "dontAsk"` denies anything not in `allowed_tools`.
  - The handler returns MCP text content, as the page's `sdk_tool_handler` does.
"""

from __future__ import annotations

import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool

from agents.section_d.weather_tool import GET_WEATHER_TOOL, get_weather

WEATHER_SERVER = "weather"


@tool(GET_WEATHER_TOOL["name"], GET_WEATHER_TOOL["description"], GET_WEATHER_TOOL["input_schema"])
async def _get_weather(args: dict[str, Any]) -> dict[str, Any]:
    try:
        result = get_weather(**dict(args or {}))
        return {"content": [{"type": "text", "text": json.dumps(result)}]}
    except Exception as exc:  # mirrors the page's sdk_tool_handler
        return {"content": [{"type": "text", "text": str(exc)}], "is_error": True}


WEATHER_MCP_SERVERS = {
    WEATHER_SERVER: create_sdk_mcp_server(WEATHER_SERVER, "1.0.0", tools=[_get_weather]),
}
WEATHER_ALLOWED_TOOLS = [f"mcp__{WEATHER_SERVER}__{GET_WEATHER_TOOL['name']}"]
