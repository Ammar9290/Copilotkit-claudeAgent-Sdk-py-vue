"""NOT DOC CODE. Hands the page's `display_flight` tool to `ClaudeAgentAdapter`.

The Fixed Schema page publishes `DISPLAY_FLIGHT_TOOL` and
`_display_flight_operations` and turns runtime tool injection off, so the agent
has to own `display_flight`. It never shows how to register a Python backend
tool on the Claude Agent SDK adapter. This bridge uses the SDK's own
primitives:

  - `tool()` + `create_sdk_mcp_server()` build an in-process MCP server; the
    published JSON `input_schema` is passed through unchanged.
  - The handler returns the published `a2ui_operations` container as one JSON
    text block. The adapter emits it as the AG-UI `TOOL_CALL_RESULT` content,
    and the runtime's A2UI middleware looks for `a2ui_operations` there.
  - The tool is granted as `mcp__flights__display_flight` because the agent
    runs with `permission_mode: "dontAsk"`.
"""

from __future__ import annotations

import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool

from agents.section_c.a2ui_fixed import DISPLAY_FLIGHT_TOOL, _display_flight_operations

SERVER_NAME = "flights"


@tool(
    DISPLAY_FLIGHT_TOOL["name"],
    DISPLAY_FLIGHT_TOOL["description"],
    DISPLAY_FLIGHT_TOOL["input_schema"],
)
async def _display_flight(args: dict[str, Any]) -> dict[str, Any]:
    operations = _display_flight_operations(
        origin=args["origin"],
        destination=args["destination"],
        airline=args["airline"],
        price=args["price"],
    )
    return {"content": [{"type": "text", "text": json.dumps(operations)}]}


flights_mcp_server = create_sdk_mcp_server(name=SERVER_NAME, version="1.0.0", tools=[_display_flight])

ALLOWED_TOOLS = [f"mcp__{SERVER_NAME}__{DISPLAY_FLIGHT_TOOL['name']}"]
