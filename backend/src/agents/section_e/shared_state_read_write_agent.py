"""Shared State — `shared_state_read_write_agent.py`, as the page publishes it.

Source: https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state
        ("Reading agent state" steps 1-3)

The page states that this route "intentionally uses its own Messages API loop.
It does not use `ClaudeAgentAdapter` or an MCP server." So it is built that way.

Verbatim from the page: SYSTEM_PROMPT, SET_NOTES_TOOL, build_preferences_block,
_state_dict, the `client.messages.stream(...)` call and the set_notes
write-back block (marked `# --- DOC ---` below).

The page publishes those fragments but not the function that holds them
(`run_shared_state_read_write_agent`), nor `normalize_claude_model`,
`DEFAULT_ANTHROPIC_MODEL`, `client`, `messages`, `msg_id` or `encoder`. Those
are supplied below and marked NOT DOC CODE. They are kept minimal: no retries,
no fallbacks.
"""

from __future__ import annotations

import json
import os
import uuid
from collections.abc import AsyncIterator
from textwrap import dedent
from typing import Any

import anthropic  # the page's loop needs the Anthropic SDK (fails to import here)
from ag_ui.core import (
    EventType,
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StateSnapshotEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from ag_ui.encoder import EventEncoder

# --- DOC --------------------------------------------------------------------

SYSTEM_PROMPT = dedent("""
    You are a helpful, concise assistant.

    The user's preferences are supplied via shared state and added at the
    start of every turn — always respect them. Address the user by name
    when known, match the requested tone, and respond in the requested
    language.

    When the user asks you to "remember" something, or you observe
    something worth surfacing in the UI's notes panel, call the
    ``set_notes`` tool with the FULL updated list of short notes
    (existing notes + new ones, not a diff). Keep each note short
    (< 120 characters). After updating notes, briefly acknowledge what
    you remembered.
""").strip()


SET_NOTES_TOOL: dict[str, Any] = {
    "name": "set_notes",
    "description": (
        "Replace the notes array in shared state with the FULL updated "
        "list. Always include every existing note plus any new ones, "
        "not a diff. Keep each note short (< 120 chars)."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "notes": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Full list of short note strings to persist.",
            },
        },
        "required": ["notes"],
    },
}


def build_preferences_block(prefs: dict[str, Any] | None) -> str | None:
    """Render the user-supplied preferences as an injectable prompt block.

    Returns ``None`` when no recognised keys are present so the system
    prompt is left untouched.
    """
    if not isinstance(prefs, dict) or not prefs:
        return None
    lines = ["The user has shared these preferences with you:"]
    if prefs.get("name"):
        lines.append(f"- Name: {prefs['name']}")
    if prefs.get("tone"):
        lines.append(f"- Preferred tone: {prefs['tone']}")
    if prefs.get("language"):
        lines.append(f"- Preferred language: {prefs['language']}")
    interests = prefs.get("interests") or []
    if isinstance(interests, list) and interests:
        lines.append(f"- Interests: {', '.join(str(i) for i in interests)}")
    if len(lines) == 1:
        # No recognised fields — don't emit a header with no content.
        return None
    lines.append(
        "Tailor every response to these preferences. Address the user "
        "by name when appropriate."
    )
    return "\n".join(lines)


def _state_dict(state: dict[str, Any]) -> dict[str, Any]:
    """Coerce the AG-UI raw state envelope into the slots we care about."""
    return {
        "preferences": state.get("preferences") or {},
        "notes": list(state.get("notes") or []),
    }

# --- END DOC ----------------------------------------------------------------


# NOT DOC CODE — the page imports these from a module it never publishes.
DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6"
MAX_STEPS = 5


def normalize_claude_model(model: str) -> str:
    """NOT DOC CODE. Unpublished helper; strips an `anthropic:` provider prefix."""
    return model.split(":", 1)[1] if model.startswith("anthropic:") else model


def to_anthropic_messages(input_data: RunAgentInput) -> list[dict[str, Any]]:
    """NOT DOC CODE. AG-UI messages -> Messages API turns (text only).

    The page never shows this conversion. Tool calls from earlier turns are
    dropped; consecutive same-role turns are merged.
    """
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


async def run_shared_state_read_write_agent(input_data: RunAgentInput) -> AsyncIterator[str]:
    """NOT DOC CODE around the DOC fragments. The page names this function and
    publishes three pieces of its body; the loop structure is repo-authored."""
    encoder = EventEncoder()
    thread_id, run_id = input_data.thread_id, input_data.run_id
    yield encoder.encode(RunStartedEvent(type=EventType.RUN_STARTED, thread_id=thread_id, run_id=run_id))
    try:
        state = _state_dict(input_data.state if isinstance(input_data.state, dict) else {})
        system = SYSTEM_PROMPT
        prefs_block = build_preferences_block(state["preferences"])
        if prefs_block:
            system = f"{system}\n\n{prefs_block}"
        if state["notes"]:
            system += "\n\nCurrent notes:\n" + "\n".join(f"- {n}" for n in state["notes"])
        messages = to_anthropic_messages(input_data)
        client = anthropic.AsyncAnthropic()
        yield encoder.encode(StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state))

        for _ in range(MAX_STEPS):
            msg_id = str(uuid.uuid4())
            # --- DOC (step 2) ---
            stream_request = client.messages.stream(
                model=normalize_claude_model(
                    os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL)
                ),
                max_tokens=2048,
                system=system,
                messages=messages,
                tools=[SET_NOTES_TOOL],
            )
            # --- END DOC ---
            started = False
            async with stream_request as stream:
                async for event in stream:
                    if event.type == "text":
                        if not started:
                            started = True
                            yield encoder.encode(TextMessageStartEvent(
                                type=EventType.TEXT_MESSAGE_START, message_id=msg_id, role="assistant"))
                        yield encoder.encode(TextMessageContentEvent(
                            type=EventType.TEXT_MESSAGE_CONTENT, message_id=msg_id, delta=event.text))
                final = await stream.get_final_message()
            if started:
                yield encoder.encode(TextMessageEndEvent(type=EventType.TEXT_MESSAGE_END, message_id=msg_id))

            assistant_content: list[dict[str, Any]] = []
            tool_calls: list[dict[str, Any]] = []
            for block in final.content:
                if block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_content.append({"type": "tool_use", "id": block.id, "name": block.name, "input": block.input})
                    tool_calls.append({"id": block.id, "name": block.name, "input": block.input})
            messages.append({"role": "assistant", "content": assistant_content})
            if not tool_calls:
                break
            for tc in tool_calls:
                yield encoder.encode(ToolCallStartEvent(type=EventType.TOOL_CALL_START, tool_call_id=tc["id"],
                                                        tool_call_name=tc["name"], parent_message_id=msg_id))
                yield encoder.encode(ToolCallArgsEvent(type=EventType.TOOL_CALL_ARGS, tool_call_id=tc["id"],
                                                       delta=json.dumps(tc["input"])))
                yield encoder.encode(ToolCallEndEvent(type=EventType.TOOL_CALL_END, tool_call_id=tc["id"]))

            # --- DOC (step 3) ---
            # Execute set_notes by mutating shared state and emitting a
            # StateSnapshotEvent so the UI re-renders the agent-authored
            # notes. This is the agent-side half of the WRITE direction.
            tool_results: list[dict[str, Any]] = []
            for tc in tool_calls:
                if tc["name"] == "set_notes":
                    notes = tc["input"].get("notes") or []
                    if isinstance(notes, list):
                        state["notes"] = [str(n) for n in notes]
                    result_text = json.dumps({"status": "ok", "count": len(state["notes"])})
                    yield encoder.encode(
                        StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state)
                    )
                else:
                    result_text = json.dumps({"error": f"unknown tool {tc['name']}"})

                yield encoder.encode(
                    ToolCallResultEvent(
                        type=EventType.TOOL_CALL_RESULT,
                        tool_call_id=tc["id"],
                        message_id=f"{msg_id}-tool-result-{tc['id']}",
                        content=result_text,
                    )
                )
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tc["id"],
                        "content": result_text,
                    }
                )
            messages.append({"role": "user", "content": tool_results})
            # --- END DOC ---

        yield encoder.encode(RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id=thread_id, run_id=run_id))
    except Exception as error:  # noqa: BLE001 — surface the real error to the UI
        yield encoder.encode(RunErrorEvent(type=EventType.RUN_ERROR, message=f"{type(error).__name__}: {error}"))
