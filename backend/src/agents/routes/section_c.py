"""Generative UI › Declarative: A2UI, JSON Render, Hashbrown.

Agent ids are derived from the route paths:

  /generative-ui/a2ui                 -> "a2ui"
  /generative-ui/a2ui/fixed-schema    -> "a2ui-fixed-schema"  (also the page's own id)
  /generative-ui/a2ui/dynamic-schema  -> "a2ui-dynamic-schema"
  /generative-ui/json-render          -> "json-render"
  /generative-ui/hashbrown            -> "hashbrown"

Only the fixed-schema agent has a backend tool (`display_flight`, through the
repo-authored MCP bridge in `agents/section_c/flights_mcp.py`). The A2UI
overview and dynamic-schema agents get `generate_a2ui` from the runtime's A2UI
middleware as a frontend tool, which the adapter serves without configuration.
JSON Render and Hashbrown agents only write a JSON reply.
"""

from agents.common import build_adapter
from agents.section_c import a2ui_fixed, flights_mcp, prompts

AGENTS = {
    "a2ui": build_adapter("a2ui", prompts.A2UI_PROMPT),
    "a2ui-fixed-schema": build_adapter(
        "a2ui-fixed-schema",
        a2ui_fixed.SYSTEM_PROMPT,
        mcp_servers={flights_mcp.SERVER_NAME: flights_mcp.flights_mcp_server},
        allowed_tools=flights_mcp.ALLOWED_TOOLS,
    ),
    "a2ui-dynamic-schema": build_adapter("a2ui-dynamic-schema", prompts.A2UI_PROMPT),
    "json-render": build_adapter("json-render", prompts.JSON_RENDER_PROMPT),
    "hashbrown": build_adapter("hashbrown", prompts.HASHBROWN_PROMPT),
}
