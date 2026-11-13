"""A2UI Fixed Schema: the backend half, as the page publishes it.

Source: https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/fixed-schema
        (blocks titled `src/agents/a2ui_fixed.py`)

The published code is kept as is. Three things the page leaves out are filled
in and marked `NOT DOC CODE`:

  * `SURFACE_ID` and `CATALOG_ID` are used by `_display_flight_operations` but
    defined nowhere on the Python side. `CATALOG_ID` is the value the page's
    `catalog.ts` exports (`"copilotkit://flight-fixed-catalog"`) and has to
    match it. `SURFACE_ID` has no published value; `"flight-fixed-schema"` is
    this repo's choice.
  * `flight_schema.json` is loaded but its content is never published. The file
    in `a2ui_schemas/` follows the tree the page draws
    (Card > Column > [Title, Row(Airport, Arrow, Airport),
    Row(AirlineBadge, PriceTag), Button]).
  * The page never shows how to hand `DISPLAY_FLIGHT_TOOL` to
    `ClaudeAgentAdapter`; see `flights_mcp.py`.
"""

import json
from pathlib import Path
from textwrap import dedent
from typing import Any

# NOT DOC CODE: used by `_display_flight_operations`, defined nowhere on the page.
CATALOG_ID = "copilotkit://flight-fixed-catalog"
SURFACE_ID = "flight-fixed-schema"

_SCHEMAS_DIR = Path(__file__).parent / "a2ui_schemas"


def _load_schema(filename: str) -> list[dict]:
    with open(_SCHEMAS_DIR / filename, "r", encoding="utf-8") as fh:
        return json.load(fh)


FLIGHT_SCHEMA = _load_schema("flight_schema.json")


SYSTEM_PROMPT = dedent("""
    You help users find flights. When asked about a flight, call
    `display_flight` with origin (3-letter code), destination (3-letter
    code), airline, and price (e.g. '$289'). Keep any chat reply to one
    short sentence.
""").strip()


DISPLAY_FLIGHT_TOOL = {
    "name": "display_flight",
    "description": (
        "Show a flight card for the given trip. Emits an a2ui_operations "
        "container the runtime A2UI middleware detects and forwards to the "
        "frontend renderer."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "origin": {
                "type": "string",
                "description": "Origin airport code, e.g. 'SFO'",
            },
            "destination": {
                "type": "string",
                "description": "Destination airport code, e.g. 'JFK'",
            },
            "airline": {"type": "string", "description": "Airline name, e.g. 'United'"},
            "price": {"type": "string", "description": "Price string, e.g. '$289'"},
        },
        "required": ["origin", "destination", "airline", "price"],
    },
}


def _display_flight_operations(
    origin: str, destination: str, airline: str, price: str
) -> dict[str, Any]:
    # A2UI v0.9 message shape — each operation is wrapped in a versioned
    # container keyed by the operation name (createSurface, updateComponents,
    # updateDataModel).
    return {
        "a2ui_operations": [
            {
                "version": "v0.9",
                "createSurface": {
                    "surfaceId": SURFACE_ID,
                    "catalogId": CATALOG_ID,
                },
            },
            {
                "version": "v0.9",
                "updateComponents": {
                    "surfaceId": SURFACE_ID,
                    "components": FLIGHT_SCHEMA,
                },
            },
            {
                "version": "v0.9",
                "updateDataModel": {
                    "surfaceId": SURFACE_ID,
                    "path": "/",
                    "value": {
                        "origin": origin,
                        "destination": destination,
                        "airline": airline,
                        "price": price,
                    },
                },
            },
        ]
    }
