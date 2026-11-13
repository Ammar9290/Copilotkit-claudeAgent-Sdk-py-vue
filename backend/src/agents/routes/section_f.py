"""Built-in Agent + Runtime (worker F) — the Python agents behind the Runtime pages.

The Runtime pages are about the Node Copilot Runtime, not about the agent. So
each one gets a plain Claude Agent SDK adapter, built the Quickstart way, that
the page's own runtime endpoint (`frontend/runtime/endpoints/section-f-*.ts`)
binds with an `HttpAgent`. Agent ids are derived from the route paths.

`/backend/ag-ui` additionally needs tool-call events to show up in its event
log, so its agent has one small in-process MCP tool.
"""

from __future__ import annotations

import json
import time
import uuid
from collections.abc import AsyncIterator
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

from agents.common import build_adapter

_SHORT = (
    "You are a helpful assistant embedded in a CopilotKit Vue demo about the "
    "Copilot Runtime. Keep every reply under 60 words."
)

# ---------------------------------------------------------------------------
# NOT DOC CODE — one backend tool for the AG-UI event-log page.
#
# "Connect AG-UI agents" lists the tool-call callbacks (onToolCallStartEvent …
# onToolCallResultEvent). An agent with no tools never emits those events, so
# this agent gets the smallest possible tool, registered the Claude Agent SDK
# way (in-process MCP server + its `mcp__<server>__<tool>` name in
# `allowed_tools`, because `dontAsk` silently denies anything not listed).
# ---------------------------------------------------------------------------


@tool(
    "roll_dice",
    "Roll N six-sided dice and return the faces.",
    {
        "type": "object",
        "properties": {"count": {"type": "integer", "minimum": 1, "maximum": 6}},
        "required": ["count"],
    },
)
async def _roll_dice(args: dict[str, Any]) -> dict[str, Any]:
    count = max(1, min(6, int(args.get("count", 1))))
    # Deterministic so recordings are stable: faces cycle 4,2,6,1,5,3.
    faces = [[4, 2, 6, 1, 5, 3][i % 6] for i in range(count)]
    return {"content": [{"type": "text", "text": json.dumps({"faces": faces, "total": sum(faces)})}]}


_DICE = "dice"
_dice_mcp = create_sdk_mcp_server(name=_DICE, version="1.0.0", tools=[_roll_dice])

_AG_UI_PROMPT = (
    _SHORT
    + " When the user asks you to roll dice, call the roll_dice tool and report "
    "the faces and the total."
)

AGENTS = {
    "section-f-copilot-runtime": build_adapter("section-f-copilot-runtime", _SHORT),
    "section-f-runtime-endpoints": build_adapter("section-f-runtime-endpoints", _SHORT),
    "section-f-agent-runner": build_adapter("section-f-agent-runner", _SHORT),
    "section-f-ag-ui": build_adapter(
        "section-f-ag-ui",
        _AG_UI_PROMPT,
        mcp_servers={_DICE: _dice_mcp},
        allowed_tools=[f"mcp__{_DICE}__roll_dice"],
    ),
    "section-f-auth": build_adapter("section-f-auth", _SHORT),
}


def register(app: FastAPI) -> None:
    """NOT DOC CODE — a header-echo AG-UI endpoint, for inspection only.

    The Copilot Runtime page ("Forwarding request headers to your agent") and
    the Authentication page both say which inbound headers the runtime passes
    on to the agent. A Claude agent never sees HTTP headers, so this endpoint
    answers a run with a single assistant message listing the headers that
    actually arrived. It is not an LLM agent and is not in `AGENTS`; only the
    Section F runtime endpoints bind it, as `header-echo`.
    """

    @app.post("/section-f-header-echo")
    async def header_echo(request: Request) -> StreamingResponse:
        body = await request.json()
        thread_id = body.get("threadId") or str(uuid.uuid4())
        run_id = body.get("runId") or str(uuid.uuid4())
        message_id = str(uuid.uuid4())
        received = {
            k: v
            for k, v in sorted(request.headers.items())
            if k == "authorization" or k.startswith("x-")
        }
        text = (
            "Headers that reached the agent server (authorization and every x- header):\n\n```json\n"
            + json.dumps(received, indent=2)
            + "\n```"
        )

        def sse(event: dict[str, Any]) -> str:
            return f"data: {json.dumps(event)}\n\n"

        async def stream() -> AsyncIterator[str]:
            ts = int(time.time() * 1000)
            yield sse({"type": "RUN_STARTED", "threadId": thread_id, "runId": run_id, "timestamp": ts})
            yield sse({"type": "TEXT_MESSAGE_START", "messageId": message_id, "role": "assistant"})
            yield sse({"type": "TEXT_MESSAGE_CONTENT", "messageId": message_id, "delta": text})
            yield sse({"type": "TEXT_MESSAGE_END", "messageId": message_id})
            yield sse({"type": "RUN_FINISHED", "threadId": thread_id, "runId": run_id})

        return StreamingResponse(stream(), media_type="text/event-stream")
