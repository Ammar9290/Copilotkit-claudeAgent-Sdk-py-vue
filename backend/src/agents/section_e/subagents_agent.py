"""Sub-Agents — `src/agents/subagents_agent.py`, as the page publishes it.

Source: https://docs.copilotkit.ai/vue/claude-sdk-python/multi-agent/subagents

Verbatim from the page (between `# --- DOC ---` markers): SUB_AGENT_PROMPTS,
SUPERVISOR_SYSTEM_PROMPT, _delegation_tool_schema, SUPERVISOR_TOOLS and
_invoke_sub_agent. The page prints `_delegation_tool_schema` / SUPERVISOR_TOOLS
three times; they appear once here.

Not published, so supplied as NOT DOC CODE:
  * `normalize_claude_model` / `DEFAULT_ANTHROPIC_MODEL` — the page's code
    uses them but the module that defines them is never shown.
  * `run_subagents_agent` — the page describes it ("runs the matching
    sub-agent synchronously, records the delegation into shared agent state,
    and returns the sub-agent's output as a tool_result") and refers to a
    "subagents-delegation-flow region" that is not on the page. The loop below
    does exactly the three things the prose lists, merging by stable `id` as
    the page's warning asks.
"""

from __future__ import annotations

import json
import os
import uuid
from collections.abc import AsyncIterator
from typing import Any

import anthropic  # the page's sub-agent calls need the Anthropic SDK (fails to import here)
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

# NOT DOC CODE — imported on the page from an unpublished module.
DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6"


def normalize_claude_model(model: str) -> str:
    """NOT DOC CODE. Unpublished helper; strips an `anthropic:` provider prefix."""
    return model.split(":", 1)[1] if model.startswith("anthropic:") else model


# --- DOC --------------------------------------------------------------------
# Each sub-agent is defined by its own system prompt; `_invoke_sub_agent`
# (below) issues a single-shot Anthropic call as that sub-agent. They
# don't share memory or tools with the supervisor — the supervisor only
# ever sees what the sub-agent returns as a tool result.
SUB_AGENT_PROMPTS: dict[str, str] = {
    "research_agent": (
        "You are a research sub-agent. Given a topic, produce a concise "
        "bulleted list of 3-5 key facts. No preamble, no closing."
    ),
    "writing_agent": (
        "You are a writing sub-agent. Given a brief and optional source "
        "facts, produce a polished 1-paragraph draft. Be clear and "
        "concrete. No preamble."
    ),
    "critique_agent": (
        "You are an editorial critique sub-agent. Given a draft, give "
        "2-3 crisp, actionable critiques. No preamble."
    ),
}


SUPERVISOR_SYSTEM_PROMPT = (
    "You are a supervisor agent that coordinates three specialized "
    "sub-agents to produce high-quality deliverables.\n\n"
    "Available sub-agents (call them as tools):\n"
    "  - research_agent: gathers facts on a topic.\n"
    "  - writing_agent: turns facts + a brief into a polished draft.\n"
    "  - critique_agent: reviews a draft and suggests improvements.\n\n"
    "For most non-trivial user requests, delegate in sequence: "
    "research -> write -> critique. Pass the relevant facts/draft "
    "through the `task` argument of each tool. Keep your own messages "
    "short — explain the plan once, delegate, then return a concise "
    "summary once done. The UI shows the user a live log of every "
    "sub-agent delegation, including the in-flight 'running' state."
)


# The supervisor delegates by calling tools. Each entry in
# `SUPERVISOR_TOOLS` is an Anthropic tool schema that the supervisor LLM
# "calls" to delegate work; the run loop in `run_subagents_agent` (see
# the subagents-delegation-flow region) runs the matching sub-agent
# synchronously, records the delegation into shared agent state, and
# returns the sub-agent's output as a tool_result the supervisor can
# read on its next step.
def _delegation_tool_schema(name: str, description: str) -> dict[str, Any]:
    return {
        "name": name,
        "description": description,
        "input_schema": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": (
                        "The full task description to hand to the "
                        "sub-agent. Pass relevant prior facts/drafts "
                        "verbatim — the sub-agent has no shared memory "
                        "with the supervisor."
                    ),
                }
            },
            "required": ["task"],
        },
    }


SUPERVISOR_TOOLS: list[dict[str, Any]] = [
    _delegation_tool_schema(
        "research_agent",
        "Delegate a research task. Returns a bulleted list of key facts.",
    ),
    _delegation_tool_schema(
        "writing_agent",
        (
            "Delegate a drafting task. Pass relevant facts in `task`. "
            "Returns a polished paragraph."
        ),
    ),
    _delegation_tool_schema(
        "critique_agent",
        "Delegate a critique task. Returns 2-3 actionable critiques.",
    ),
]


async def _invoke_sub_agent(
    client: anthropic.AsyncAnthropic,
    sub_agent: str,
    task: str,
) -> str:
    """Issue a single-shot Anthropic call as the named sub-agent.

    Returns the concatenated text content of the response. Raises any
    SDK exception so the caller can mark the delegation as ``failed``.
    """
    response = await client.messages.create(
        model=normalize_claude_model(
            os.getenv("ANTHROPIC_SUBAGENT_MODEL", DEFAULT_ANTHROPIC_MODEL)
        ),
        max_tokens=1024,
        system=SUB_AGENT_PROMPTS[sub_agent],
        messages=[{"role": "user", "content": task}],
    )
    parts: list[str] = []
    for block in response.content:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", ""))
    text = "".join(parts).strip()
    if not text:
        raise RuntimeError("sub-agent returned empty response")
    return text

# --- END DOC ----------------------------------------------------------------


MAX_STEPS = 8


def _to_anthropic_messages(input_data: RunAgentInput) -> list[dict[str, Any]]:
    """NOT DOC CODE. AG-UI messages -> Messages API turns (text only)."""
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


async def run_subagents_agent(input_data: RunAgentInput) -> AsyncIterator[str]:
    """NOT DOC CODE. The page's unpublished "subagents-delegation-flow" loop."""
    encoder = EventEncoder()
    thread_id, run_id = input_data.thread_id, input_data.run_id
    yield encoder.encode(RunStartedEvent(type=EventType.RUN_STARTED, thread_id=thread_id, run_id=run_id))
    try:
        raw = input_data.state if isinstance(input_data.state, dict) else {}
        # Merge by stable id (the page's warning): the client echoes its copy back.
        delegations: dict[str, dict[str, Any]] = {
            d["id"]: d for d in (raw.get("delegations") or []) if isinstance(d, dict) and d.get("id")
        }
        state = {**raw, "delegations": list(delegations.values())}

        def snapshot() -> str:
            state["delegations"] = list(delegations.values())
            return encoder.encode(StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot=state))

        client = anthropic.AsyncAnthropic()
        messages = _to_anthropic_messages(input_data)
        yield snapshot()

        for _ in range(MAX_STEPS):
            msg_id = str(uuid.uuid4())
            response = await client.messages.create(
                model=normalize_claude_model(os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL)),
                max_tokens=2048,
                system=SUPERVISOR_SYSTEM_PROMPT,
                messages=messages,
                tools=SUPERVISOR_TOOLS,
            )
            text = "".join(b.text for b in response.content if b.type == "text").strip()
            if text:
                yield encoder.encode(TextMessageStartEvent(type=EventType.TEXT_MESSAGE_START, message_id=msg_id, role="assistant"))
                yield encoder.encode(TextMessageContentEvent(type=EventType.TEXT_MESSAGE_CONTENT, message_id=msg_id, delta=text))
                yield encoder.encode(TextMessageEndEvent(type=EventType.TEXT_MESSAGE_END, message_id=msg_id))
            calls = [b for b in response.content if b.type == "tool_use"]
            messages.append({"role": "assistant", "content": [
                {"type": "text", "text": b.text} if b.type == "text"
                else {"type": "tool_use", "id": b.id, "name": b.name, "input": b.input}
                for b in response.content if b.type in ("text", "tool_use")
            ]})
            if not calls:
                break
            results: list[dict[str, Any]] = []
            for call in calls:
                task = str(call.input.get("task", ""))
                yield encoder.encode(ToolCallStartEvent(type=EventType.TOOL_CALL_START, tool_call_id=call.id,
                                                        tool_call_name=call.name, parent_message_id=msg_id))
                yield encoder.encode(ToolCallArgsEvent(type=EventType.TOOL_CALL_ARGS, tool_call_id=call.id,
                                                       delta=json.dumps(call.input)))
                yield encoder.encode(ToolCallEndEvent(type=EventType.TOOL_CALL_END, tool_call_id=call.id))
                delegations[call.id] = {"id": call.id, "sub_agent": call.name, "task": task,
                                        "status": "running", "result": ""}
                yield snapshot()
                try:
                    if call.name not in SUB_AGENT_PROMPTS:
                        raise RuntimeError(f"unknown sub-agent {call.name}")
                    output = await _invoke_sub_agent(client, call.name, task)
                    delegations[call.id] |= {"status": "completed", "result": output}
                except Exception as error:  # noqa: BLE001 — recorded as a failed delegation
                    output = f"Sub-agent failed: {error}"
                    delegations[call.id] |= {"status": "failed", "result": output}
                yield snapshot()
                yield encoder.encode(ToolCallResultEvent(type=EventType.TOOL_CALL_RESULT, tool_call_id=call.id,
                                                         message_id=f"{msg_id}-result-{call.id}", content=output))
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
            messages.append({"role": "user", "content": results})

        yield encoder.encode(RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id=thread_id, run_id=run_id))
    except Exception as error:  # noqa: BLE001 — surface the real error to the UI
        yield encoder.encode(RunErrorEvent(type=EventType.RUN_ERROR, message=f"{type(error).__name__}: {error}"))
