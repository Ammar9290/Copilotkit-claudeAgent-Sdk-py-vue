"""Generative UI (MCP Apps, Open Generative UI, Tool Rendering, Component as
tool) and Frontend Tools — one adapter per doc route.

Only Tool Rendering has a backend tool (`get_weather`, see
`agents/section_d/`). Every other page's tools come from the frontend or the
runtime: `useComponent` / `useFrontendTool` register frontend tools, the MCP
Apps middleware injects the MCP server's UI tools, and the Open Generative UI
middleware injects `generateSandboxedUi`. All of those reach the adapter in
`input.tools` and are served from its own `ag_ui` MCP server, so the agents
need no tool configuration — which is what the Open Generative UI page's
"Your agent must pass frontend tools to its model" warning asks for.

The prompts are repo-authored: they only keep replies short for recordings.
"""

from agents.common import build_adapter
from agents.section_d.weather_mcp import WEATHER_ALLOWED_TOOLS, WEATHER_MCP_SERVERS

_SHORT = (
    "You are a helpful assistant embedded in a CopilotKit Vue demo. "
    "Keep every reply under 60 words unless the user asks for more."
)

AGENTS = {
    "generative-ui-tool-rendering": build_adapter(
        "generative-ui-tool-rendering",
        _SHORT + " Use the get_weather tool for any weather question.",
        mcp_servers=WEATHER_MCP_SERVERS,
        allowed_tools=WEATHER_ALLOWED_TOOLS,
    ),
    "generative-ui-tool-based": build_adapter(
        "generative-ui-tool-based",
        _SHORT
        + " When the user asks about the weather somewhere, show it with the show_weather tool "
        "(make up plausible values; you have no live weather data) and then add one short sentence.",
    ),
    "frontend-tools": build_adapter("frontend-tools", _SHORT),
    "generative-ui-mcp-apps": build_adapter("generative-ui-mcp-apps", _SHORT),
    "open-gen-ui": build_adapter("open-gen-ui", _SHORT),
}
