"""State Rendering and State Streaming (worker G).

Both pages publish the same Python backend: `stream_document_state`, which
reads a raw Anthropic Messages API stream and emits a STATE_SNAPSHOT every time
the streamed `write_document.document` argument grows. That is not
`ClaudeAgentAdapter` (the adapter consumes the model stream internally and
never hands one out), so there are no AGENTS here. Two plain endpoints mount
the same loop, one per page:

  POST /generative-ui-state-rendering  — State Rendering (frontend id `researcher`)
  POST /shared-state-streaming         — State Streaming (frontend id `writer`)

They are absent from `/health`, so `/api/copilotkit` cannot discover them; each
Demo.vue reaches its endpoint directly through Vite's `/agent` proxy (see the
nav notes).

The loop (`agents/section_g/state_streaming_agent.py`) imports `anthropic`.
It is imported per request so an import failure (README §8: `jiter` blocked by
Windows Application Control) reaches the browser as a RUN_ERROR. When built,
the import worked and every run ended in the Anthropic client's
"Could not resolve authentication method" error (no ANTHROPIC_API_KEY).
Not worked around.
"""

from __future__ import annotations

import importlib
from collections.abc import AsyncIterator, Callable

from ag_ui.core import EventType, RunAgentInput, RunErrorEvent, RunStartedEvent
from ag_ui.encoder import EventEncoder
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

AGENTS: dict = {}


def _lazy_runner(module: str, func: str) -> Callable[[RunAgentInput], AsyncIterator[str]]:
    """NOT DOC CODE. Import the loop per request so an import failure becomes a
    visible RUN_ERROR instead of stopping the whole server."""

    async def run(input_data: RunAgentInput) -> AsyncIterator[str]:
        try:
            runner = getattr(importlib.import_module(module), func)
        except Exception as error:  # noqa: BLE001
            encoder = EventEncoder()
            yield encoder.encode(RunStartedEvent(
                type=EventType.RUN_STARTED, thread_id=input_data.thread_id, run_id=input_data.run_id))
            yield encoder.encode(RunErrorEvent(
                type=EventType.RUN_ERROR, message=f"{type(error).__name__}: {error}"))
            return
        async for chunk in runner(input_data):
            yield chunk

    return run


run_state_streaming_agent = _lazy_runner(
    "agents.section_g.state_streaming_agent", "run_state_streaming_agent"
)


def _endpoint(app: FastAPI, path: str) -> None:
    """NOT DOC CODE. Neither page publishes an endpoint; same shape as the
    Shared State page's `@app.post("/shared-state-read-write")`."""

    @app.post(path, name=f"run{path.replace('/', '_').replace('-', '_')}")
    async def endpoint(request: Request) -> StreamingResponse:
        input_data = RunAgentInput(**(await request.json()))

        async def event_stream() -> AsyncIterator[str]:
            async for chunk in run_state_streaming_agent(input_data):
                yield chunk

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )


def register(app: FastAPI) -> None:
    _endpoint(app, "/generative-ui-state-rendering")
    _endpoint(app, "/shared-state-streaming")
