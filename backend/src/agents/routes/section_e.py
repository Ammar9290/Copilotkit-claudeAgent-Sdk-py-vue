"""Shared State, Human in the Loop, Sub-Agents (worker E).

Two kinds of backend live here.

1. `ClaudeAgentAdapter` agents (AGENTS) for the pages that publish no backend
   of their own and only teach Vue composables:
     - Render agent state in your app: canvas state reaches the adapter as
       `input.state`; the adapter appends it to the prompt and adds its own
       `ag_ui_update_state` tool, so the agent can write it back.
     - Agent Read-Only Context: `useAgentContext` entries arrive as
       `input.context`; the adapter appends them to the system prompt.
     - HITL Overview / Governed Actions: `useHumanInTheLoop` tools arrive in
       `input.tools`; the adapter serves them from its `ag_ui` MCP server.
   The prompts are repo-authored (the pages publish none).

2. Raw Anthropic Messages API loops (`register`) for the two pages whose
   published Python backend is that loop and explicitly not the adapter:
     - POST /shared-state-read-write — the Shared State page's own path.
     - POST /multi-agent-subagents   — the Sub-Agents page (it names no path).
   Their code is in `agents/section_e/`. They call `anthropic.AsyncAnthropic()`,
   which needs ANTHROPIC_API_KEY (the CLI login does not cover it), so every
   run ends in a RUN_ERROR. They are imported per request so an import-time
   failure (seen earlier on this machine: Application Control blocking jiter)
   also surfaces as a RUN_ERROR instead of stopping the server. Not worked around.
"""

from __future__ import annotations

import importlib
from collections.abc import AsyncIterator, Callable

from ag_ui.core import EventType, RunAgentInput, RunErrorEvent, RunStartedEvent
from ag_ui.encoder import EventEncoder
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

from agents.common import build_adapter

_SHORT = (
    "You are a helpful assistant embedded in a CopilotKit Vue demo. "
    "Keep every reply under 60 words unless the user asks for more."
)

_CANVAS = (
    _SHORT
    + " The app's main view is a project canvas whose title and checklist items are the "
    "shared state you are given. When the user asks to change the title, add, rename, "
    "remove, check or uncheck items, update the shared state (keep every existing item, "
    "give new items a short kebab-case id) and confirm in one sentence."
)

_GOVERNED = (
    _SHORT
    + " You can propose side-effecting actions (sending emails, updating records, "
    "creating tickets, applying discounts). Before ANY such action, call "
    "approve_governed_action with a fresh id, a one-line summary, the tool name you would "
    "run, a policy reference like 'POL-7', a verdict, and the exact arguments. Verdict "
    "rules: discounts over 20% -> deny; read-only or internal-only actions -> allow; "
    "everything else -> require_approval. The tool result is "
    "{approved, actionId, reference}: the action may run ONLY if approved is true and "
    "actionId/reference match what you proposed; otherwise it was rejected or blocked. "
    "Never call any tool other than approve_governed_action — the side effects are "
    "simulated. After the decision, say in one sentence whether the action would now run "
    "or was not run."
)

AGENTS = {
    "shared-state-rendering-in-app": build_adapter("shared-state-rendering-in-app", _CANVAS),
    "shared-state-agent-readonly": build_adapter("shared-state-agent-readonly", _SHORT),
    "human-in-the-loop": build_adapter(
        "human-in-the-loop",
        _SHORT + " When the user wants to schedule or book a meeting or call, use the "
        "schedule_meeting tool and then confirm the slot they picked.",
    ),
    "human-in-the-loop-governed-actions": build_adapter(
        "human-in-the-loop-governed-actions", _GOVERNED
    ),
}


def _lazy_runner(module: str, func: str) -> Callable[[RunAgentInput], AsyncIterator[str]]:
    """NOT DOC CODE. Import the page's module per request so an import failure
    becomes a visible RUN_ERROR instead of stopping the whole server."""

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


run_shared_state_read_write_agent = _lazy_runner(
    "agents.section_e.shared_state_read_write_agent", "run_shared_state_read_write_agent"
)
run_subagents_agent = _lazy_runner("agents.section_e.subagents_agent", "run_subagents_agent")


def register(app: FastAPI) -> None:
    # --- DOC: Shared State, step 4 "Serve the shared-state loop" (verbatim) ---
    @app.post("/shared-state-read-write")
    async def shared_state_read_write_endpoint(request: Request) -> StreamingResponse:
        """Bidirectional shared state demo — UI writes preferences, agent writes notes.

        Uses its own streaming loop (not the shared sales-assistant
        ``run_agent``) because the state schema, tools, and prompt-injection
        middleware are all demo-specific.
        """
        body = await request.json()
        input_data = RunAgentInput(**body)

        async def event_stream() -> AsyncIterator[str]:
            async for chunk in run_shared_state_read_write_agent(input_data):
                yield chunk

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    # --- END DOC ---

    # NOT DOC CODE: the Sub-Agents page publishes no endpoint; same shape as above.
    @app.post("/multi-agent-subagents")
    async def subagents_endpoint(request: Request) -> StreamingResponse:
        input_data = RunAgentInput(**(await request.json()))

        async def event_stream() -> AsyncIterator[str]:
            async for chunk in run_subagents_agent(input_data):
                yield chunk

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
