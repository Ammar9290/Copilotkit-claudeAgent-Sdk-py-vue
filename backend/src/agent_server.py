"""The Claude Agent SDK (Python) agent server.

One FastAPI app, one AG-UI endpoint per registered agent. The handler is the
Quickstart's `@app.post("/")` handler, mounted once per agent id — including
its graceful RUN_ERROR path, so a malformed body or a mid-stream failure
reaches the browser as an AG-UI error event instead of a dead SSE connection.

Run:  uv run uvicorn agent_server:app --app-dir src --port 8000 --reload
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator

from dotenv import load_dotenv

load_dotenv()

# NOT DOC CODE. The Claude Agent SDK gives each new CLI subprocess 60s to answer
# its `initialize` handshake (read from this env var, in ms). On a loaded
# machine — a screen recorder, several browsers — cold starts miss that and the
# run dies with "Control request timeout: initialize". 180s rides that out.
os.environ.setdefault("CLAUDE_CODE_STREAM_CLOSE_TIMEOUT", "180000")

from ag_ui.core import EventType, RunAgentInput, RunErrorEvent  # noqa: E402
from ag_ui.encoder import EventEncoder  # noqa: E402
from ag_ui_claude_sdk import ClaudeAgentAdapter  # noqa: E402
from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import StreamingResponse  # noqa: E402

from agents.common import DEFAULT_ANTHROPIC_MODEL  # noqa: E402
from agents.registry import REGISTRARS, REGISTRY, SOURCES  # noqa: E402

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger("claude_agent")

app = FastAPI(
    title="CopilotKit + Vue + Claude Agent SDK (Python) — agent server",
    description="One AG-UI endpoint per doc route.",
)


def _mount(agent_id: str, adapter: ClaudeAgentAdapter) -> None:
    @app.post(f"/{agent_id}", name=f"run_{agent_id}")
    async def run_agent(request: Request) -> StreamingResponse:
        encoder = EventEncoder()
        input_data = RunAgentInput(**(await request.json()))

        async def event_stream() -> AsyncIterator[str]:
            try:
                async for event in adapter.run(input_data):
                    yield encoder.encode(event)
            except Exception as error:  # noqa: BLE001
                logger.exception("Claude agent run failed: %s", agent_id)
                yield encoder.encode(
                    RunErrorEvent(type=EventType.RUN_ERROR, message=str(error))
                )

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )


for _agent_id, _adapter in REGISTRY.items():
    _mount(_agent_id, _adapter)

for _register in REGISTRARS:
    _register(app)


@app.get("/health")
async def health() -> dict:
    """The runtime reads `agents` from here to register one HttpAgent per id."""
    return {
        "status": "ok",
        "agents": sorted(REGISTRY),
        "sources": SOURCES,
        "count": len(REGISTRY),
        "anthropicKey": bool(os.getenv("ANTHROPIC_API_KEY")),
        "model": os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL),
    }


if not os.getenv("ANTHROPIC_API_KEY"):
    logger.warning(
        "ANTHROPIC_API_KEY is not set — runs will fail unless the Claude Code CLI "
        "on this machine is already authenticated. Put it in backend/.env."
    )
logger.info("Mounted %d agents: %s", len(REGISTRY), ", ".join(sorted(REGISTRY)))


if __name__ == "__main__":
    # No `--reload`, on purpose. On Windows uvicorn's reloader switches to the
    # selector event loop, which cannot spawn subprocesses, so every run would
    # fail with a blank "Failed to start Claude Code: " (an empty
    # NotImplementedError). Restart this process after editing agents.
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("AGENT_HOST", "localhost"),
        port=int(os.environ.get("AGENT_PORT", "8100")),
    )
