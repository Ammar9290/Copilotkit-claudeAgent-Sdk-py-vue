"""Generative UI › Declarative › Components and surfaces — one adapter per route.

The "Components and surfaces" pages put all of the generative UI in the
browser and the runtime: the provider sends a catalog in
`forwardedProps.copilotkit.ui`, the runtime adds a `render_ui` tool plus a
guide (context entry) to the run, or, in markdown mode, the provider sends the
schema and a writing guide as context. The page's only agent-side requirement
is: "Your agent must pass the run's tools and context to its model".
`ClaudeAgentAdapter` already does both (frontend tools → its `ag_ui` MCP
server; context → appended to the system prompt), so every agent below is a
plain adapter with the page's system prompt.

The page's agent is a TanStack `BuiltInAgent` on OpenAI with this prompt:
    "You are a helpful assistant. When a visual answer helps, render it with
    generative UI."
That prompt is used verbatim here.

Agent ids are derived from the route paths (`/generative-ui/components/<x>`).
"""

from __future__ import annotations

import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool
from fastapi import FastAPI
from fastapi.responses import Response

from agents.common import FilePromptAdapter, build_adapter

# The page's system prompt, verbatim (Components and surfaces › Try it › step 2).
GEN_UI_PROMPT = (
    "You are a helpful assistant. When a visual answer helps, render it with "
    "generative UI."
)

# ---------------------------------------------------------------------------
# NOT DOC CODE — a product source for the shop catalogs.
#
# The Catalogs and Surfaces pages describe ProductCard as "One product. Copy
# every value from a product of a tool result." and never publish that tool.
# This is the smallest backend tool that gives the agent a tool result to copy
# from, registered the Claude Agent SDK way (in-process MCP server + its
# `mcp__<server>__<tool>` name in `allowed_tools`, because `dontAsk` silently
# denies anything not listed). The product images are tiny SVGs served by this
# module's `register(app)` so the URLs the agent copies stay short.
# ---------------------------------------------------------------------------

_PRODUCTS: list[dict[str, Any]] = [
    {"productId": "kb-01", "name": "Mechanical Keyboard", "price": 129, "hue": 20},
    {"productId": "ms-02", "name": "Wireless Mouse", "price": 49, "hue": 200},
    {"productId": "hd-03", "name": "Noise-cancelling Headphones", "price": 249, "hue": 280},
    {"productId": "mn-04", "name": "4K Monitor", "price": 399, "hue": 140},
    {"productId": "rs-05", "name": "Trail Running Shoes", "price": 89, "hue": 0},
    {"productId": "rs-06", "name": "Road Running Shoes", "price": 59, "hue": 45},
]

#: The browser reaches the agent server through Vite's `/agent` proxy.
_IMAGE_BASE = "/agent/section-b/products"


def _product_view(p: dict[str, Any]) -> dict[str, Any]:
    return {
        "productId": p["productId"],
        "name": p["name"],
        "price": p["price"],
        "imageUrl": f"{_IMAGE_BASE}/{p['productId']}.svg",
    }


@tool(
    "get_products",
    "List the products of the Acme shop: productId, name, price (USD) and imageUrl.",
    {"type": "object", "properties": {}, "additionalProperties": False},
)
async def _get_products(_args: dict[str, Any]) -> dict[str, Any]:
    products = [_product_view(p) for p in _PRODUCTS]
    return {"content": [{"type": "text", "text": json.dumps(products)}]}


_SHOP_SERVER = "shop"
_shop_mcp = create_sdk_mcp_server(name=_SHOP_SERVER, version="1.0.0", tools=[_get_products])
_SHOP_TOOLS = {"mcp_servers": {_SHOP_SERVER: _shop_mcp}, "allowed_tools": [f"mcp__{_SHOP_SERVER}__get_products"]}


def register(app: FastAPI) -> None:
    """NOT DOC CODE. Serves the product swatches the `get_products` result links to."""

    @app.get("/section-b/products/{product_id}.svg")
    async def product_image(product_id: str) -> Response:
        product = next((p for p in _PRODUCTS if p["productId"] == product_id), None)
        hue = product["hue"] if product else 0
        label = (product["name"] if product else "?").split(" ")[-1]
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100">'
            f'<rect width="160" height="100" fill="hsl({hue} 70% 85%)"/>'
            f'<text x="80" y="58" font-family="sans-serif" font-size="16" text-anchor="middle" '
            f'fill="hsl({hue} 50% 30%)">{label}</text></svg>'
        )
        return Response(svg, media_type="image/svg+xml")


# ---------------------------------------------------------------------------
# Markdown mode › "Build your own prompt".
#
# With `sendContext: false` the provider sends no context entries; the backend
# reads the catalog from `forwardedProps.copilotkit.ui` and builds the prompt
# itself. The page's Python lines are used verbatim inside
# `build_options`, the per-run hook of `ClaudeAgentAdapter` (where the page's
# `input` is the run's `RunAgentInput`). The hook itself is NOT DOC CODE: the
# page does not say where in a Claude Agent SDK backend the lines go.
# ---------------------------------------------------------------------------

MY_PROMPT = GEN_UI_PROMPT


class OwnPromptAdapter(FilePromptAdapter):
    """NOT DOC CODE (the hook). The body is the page's snippet."""

    def build_options(self, input_data=None, thread_id=None, profile_options=None, resolve_frontend_result=None):
        profile = profile_options
        forwarded = getattr(input_data, "forwarded_props", None) or {}
        if isinstance(forwarded, dict) and isinstance(forwarded.get("copilotkit"), dict) and "ui" in forwarded["copilotkit"]:
            # [!code highlight:3] — the page's lines
            ui = forwarded["copilotkit"]["ui"]
            catalog = ui["1.0"]["inlineCatalogs"][0]
            system = f"{MY_PROMPT}\n\n{catalog['instructions']}\n\nComponents:\n{json.dumps(catalog['components'])}"
            profile = dict(profile_options if isinstance(profile_options, dict) else vars(profile_options) if profile_options else {})
            profile["system_prompt"] = system
        return super().build_options(
            input_data,
            thread_id=thread_id,
            profile_options=profile,
            resolve_frontend_result=resolve_frontend_result,
        )


def _own_prompt_adapter(name: str) -> OwnPromptAdapter:
    # Same options as build_adapter() builds; only the class differs.
    base = build_adapter(name, MY_PROMPT)
    return OwnPromptAdapter(name=name, options=base._options)


AGENTS = {
    # Components and surfaces (overview): standardUI in the chat.
    "gen-ui-components": build_adapter("gen-ui-components", GEN_UI_PROMPT),
    # Surfaces: shopUI + a "featured" page target.
    "gen-ui-components-surfaces": build_adapter(
        "gen-ui-components-surfaces", GEN_UI_PROMPT, **_SHOP_TOOLS
    ),
    # Catalogs: shopUI (ProductGrid + ProductCard) in the chat.
    "gen-ui-components-catalogs": build_adapter(
        "gen-ui-components-catalogs", GEN_UI_PROMPT, **_SHOP_TOOLS
    ),
    # Standard catalog: standardUI.omit([...]) + Card override.
    "gen-ui-components-standard-catalog": build_adapter(
        "gen-ui-components-standard-catalog", GEN_UI_PROMPT
    ),
    # State and actions: state/bind, functions/events, writable.
    "gen-ui-components-state-and-actions": build_adapter(
        "gen-ui-components-state-and-actions", GEN_UI_PROMPT, **_SHOP_TOOLS
    ),
    # Theming: standardUI + theme.
    "gen-ui-components-theming": build_adapter("gen-ui-components-theming", GEN_UI_PROMPT),
    # Transports: tool vs markdown vs agentIds (own runtime endpoint).
    "gen-ui-components-transports": build_adapter("gen-ui-components-transports", GEN_UI_PROMPT),
    # Markdown mode: transport: 'markdown'.
    "gen-ui-components-markdown-mode": build_adapter(
        "gen-ui-components-markdown-mode", GEN_UI_PROMPT
    ),
    # Markdown mode › Build your own prompt: sendContext: false + the page's Python lines.
    "gen-ui-components-markdown-mode-own-prompt": _own_prompt_adapter(
        "gen-ui-components-markdown-mode-own-prompt"
    ),
    # Adopt from A2UI: the converted acme/flights@1 catalog.
    "gen-ui-components-from-a2ui": build_adapter("gen-ui-components-from-a2ui", GEN_UI_PROMPT),
}
