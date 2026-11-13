"""NOT DOC CODE — the run loop around the published `stream_document_state`.

Both pages publish `stream_document_state(anthropic_stream, state)` and the
`WRITE_DOCUMENT_TOOL_SCHEMA` (see `state_streaming_backend.py`, verbatim),
but not the code that opens `anthropic_stream`, sends the tool to Claude, or
frames the AG-UI run. This module supplies the minimum:

  RUN_STARTED → one streamed
  `client.messages.stream(...)` turn with `tools=[WRITE_DOCUMENT_TOOL_SCHEMA]`,
  fed straight into the published `stream_document_state` → any assistant
  text from that turn → RUN_FINISHED.

Kept deliberately small: one model turn, no retries, no tool_result round
trip (the page says the final tool value lands in the same key; here the last
streamed snapshot already holds the full `document`).

The page's loop needs the Anthropic SDK, so this module imports `anthropic`
at module scope. README §8 records that import failing on this machine
(Windows Application Control blocking `jiter`); `agents/routes/section_g.py`
imports this module per request so such a failure becomes a RUN_ERROR rather
than stopping the server. When this route was built, the import worked, and
the run failed one step later: the raw Messages API needs
`ANTHROPIC_API_KEY`, which is not set, and the Claude Code CLI login the
ClaudeAgentAdapter routes use does not authenticate it:
  TypeError: "Could not resolve authentication method. Expected one of
  api_key, auth_token, or credentials to be set. ..."
Not worked around.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncIterator
from typing import Any

import anthropic  # the page's loop needs the Anthropic SDK
from ag_ui.core import (
    EventType,
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
)
from ag_ui.encoder import EventEncoder

from agents.common import DEFAULT_ANTHROPIC_MODEL
from agents.section_g.state_streaming_backend import (
    WRITE_DOCUMENT_TOOL_SCHEMA,
    AgentState,
    stream_document_state,
)

# Repo-authored prompt (neither page publishes one).
SYSTEM_PROMPT = (
    "You are a writing assistant in a CopilotKit Vue demo. Whenever the user asks "
    "for a document, essay, brief, email or any other long-form text, call the "
    "write_document tool with the complete text in its `document` argument. Do not "
    "repeat the text in chat. After the tool call, reply with one short sentence."
)


def to_anthropic_messages(input_data: RunAgentInput) -> list[dict[str, Any]]:
    """AG-UI messages -> Messages API turns (text only; tool turns dropped)."""
    out: list[dict[str, Any]] = []
    for m in input_data.messages:
        if m.role not in ("user", "assistant"):
            continue
        content = m.content if isinstance(m.content, str) else ""
        if not content:
            continue
        if out and out[-1]["role"] == m.role:
            out[-1]["content"] += "\n\n" + content
        else:
            out.append({"role": m.role, "content": content})
    return out


async def run_state_streaming_agent(input_data: RunAgentInput) -> AsyncIterator[str]:
    encoder = EventEncoder()
    thread_id, run_id = input_data.thread_id, input_data.run_id
    yield encoder.encode(RunStartedEvent(type=EventType.RUN_STARTED, thread_id=thread_id, run_id=run_id))
    try:
        incoming = input_data.state if isinstance(input_data.state, dict) else {}
        # Only the published handler emits snapshots (when `document` changes).
        state = AgentState(document=str(incoming.get("document") or ""))

        client = anthropic.AsyncAnthropic()
        text_parts: list[str] = []

        async with client.messages.stream(
            model=os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL),
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=to_anthropic_messages(input_data),
            tools=[WRITE_DOCUMENT_TOOL_SCHEMA],
        ) as anthropic_stream:

            async def tee() -> AsyncIterator[Any]:
                # Pass every event through to the published handler; keep the
                # assistant's own text so the chat gets a reply afterwards.
                async for event in anthropic_stream:
                    if event.type == "content_block_delta" and event.delta.type == "text_delta":
                        text_parts.append(event.delta.text)
                    yield event

            # --- the published handler, unchanged ---
            async for chunk in stream_document_state(tee(), state):
                yield chunk

        if text_parts:
            msg_id = str(uuid.uuid4())
            yield encoder.encode(TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START, message_id=msg_id, role="assistant"))
            yield encoder.encode(TextMessageContentEvent(
                type=EventType.TEXT_MESSAGE_CONTENT, message_id=msg_id, delta="".join(text_parts)))
            yield encoder.encode(TextMessageEndEvent(type=EventType.TEXT_MESSAGE_END, message_id=msg_id))

        yield encoder.encode(RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id=thread_id, run_id=run_id))
    except Exception as error:  # noqa: BLE001 — surface the real error to the UI
        yield encoder.encode(RunErrorEvent(type=EventType.RUN_ERROR, message=f"{type(error).__name__}: {error}"))
