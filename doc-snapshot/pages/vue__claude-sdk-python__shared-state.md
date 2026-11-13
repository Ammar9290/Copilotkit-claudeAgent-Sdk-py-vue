# Shared State

> Create a two-way connection between your UI and agent state.

## What is shared state?

Agentic Copilots maintain a shared state that seamlessly connects your UI with the agent's execution. This shared state system allows you to:

- Display the agent's current progress and intermediate results
- Update the agent's state through UI interactions
- React to state changes in real-time across your application

<ImageZoom
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/SharedStateCoAgents.gif"
  alt="Shared State Demo"
  width={1000}
  height={1000}
  className="rounded-lg shadow-lg border mt-0"
/>

## When should I use this?

Use shared state when you want the agent and the user to collaborate through the same application state. The agent's outputs are reflected in the UI, and user updates in the UI are reflected in the agent's execution.

<OpsPlatformCTA
  variant="inline"
  title="Building stateful agents?"
  body="Persistent threads ship with CopilotKit Intelligence on the free Developer tier."
  surface="docs_shared_state"
/>

## Reading agent state

<Steps>
  <Step>
    ### Put shared state in the system prompt and tools

    The demo exposes frontend preferences to Claude and gives the agent a tool
    for writing notes back into CopilotKit state. Keep the state contract small,
    typed, and mirrored by the UI components that read the same values.

    
~~~~python title="shared_state_read_write_agent.py"
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


~~~~

  </Step>

  <Step>
    ### Register `set_notes` with Claude

    This dedicated demo uses the Anthropic Messages API directly. Pass the
    schema to `client.messages.stream` so Claude can call `set_notes`.

    
~~~~python title="shared_state_read_write_agent.py"
        stream_request = client.messages.stream(
            model=normalize_claude_model(
                os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL)
            ),
            max_tokens=2048,
            system=system,
            messages=messages,
            tools=[SET_NOTES_TOOL],
        )
~~~~

  </Step>

  <Step>
    ### Write the tool result back to shared state

    When Claude calls `set_notes`, replace the notes array, emit a
    `StateSnapshotEvent` for the UI, and return a `ToolCallResultEvent` to
    Claude before the loop continues.

    
~~~~python title="shared_state_read_write_agent.py"
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
~~~~

  </Step>

  <Step>
    ### Serve the shared-state loop

    Mount the dedicated runner on `/shared-state-read-write` and return its
    AG-UI events as a streaming response.

    
~~~~python title="agent_server.py"
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


~~~~

  </Step>
</Steps>

<Callout type="info">
  This Python route intentionally uses its own Messages API loop. It does not
  use `ClaudeAgentAdapter` or an MCP server.
</Callout>

Subscribe a component to the agent's state with `useAgent`. Any time the agent mutates its state, for example via a tool call, the composable updates its reactive `agent` ref and your UI re-renders with the new values.

```vue title="src/components/SharedWorkspace.vue"
<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type WorkspaceState = {
  notes?: string[];
  preferences?: { tone?: string };
};

const { agent } = useAgent({
  agentId: "workspace",
  updates: [UseAgentUpdate.OnStateChanged],
});
const state = computed(
  () => (agent.value?.state ?? {}) as WorkspaceState,
);
</script>

<template>
  <ul>
    <li v-for="note in state.notes ?? []" :key="note">{{ note }}</li>
  </ul>
</template>
```

The returned `agent.value.state` is a plain object. Read it like any other reactive application data and render the parts you care about: agent-written notes, structured outputs, progress indicators, or anything else the agent has put there.

## Writing agent state

The same agent object exposes `setState`. Calling it from a UI event handler pushes the new value into shared state, and the agent reads it back on its next turn. The UI's writes visibly steer the model.

```vue title="src/components/SharedWorkspace.vue"
<script setup lang="ts">
function setTone(tone: string) {
  const current = agent.value;
  if (!current) return;

  const previous = (current.state ?? {}) as WorkspaceState;
  current.setState({
    ...previous,
    preferences: { ...previous.preferences, tone },
  });
}
</script>

<template>
  <button @click="setTone('concise')">Prefer concise answers</button>
</template>
```

This is what makes the channel two-way: the UI doesn't just observe the agent, it can hand the agent fresh inputs — preferences, selections, or partial work — without going through the chat thread.

## Rendering shared state in the UI

Because `agent.state` is plain data exposed through a Vue ref, the UI layer is ordinary Vue. The example above wires the agent's outputs into a list and feeds user edits back through `setState`.

Nothing about this is chat-specific: `useAgent` works in any component under `CopilotKitProvider`, so you can render agent state in your main view or canvas, not just inside the chat panel. See **[Render agent state in your app](/vue/claude-sdk-python/vue/shared-state/rendering-in-app)** for the full main-view pattern.

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import SharedWorkspace from "./components/SharedWorkspace.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <SharedWorkspace />
    <CopilotChat agent-id="workspace" />
  </CopilotKitProvider>
</template>
```

## Streaming partial state updates

By default, agent state only updates *between* backend checkpoints, so a long-running tool call appears as one big burst at the end. State streaming forwards a specific tool argument straight into a state key *as it's being generated*, so the UI can watch the answer assemble token-by-token.

```python
# src/app/demos/shared-state-streaming/state_streaming_backend.snippet.py
import json
from collections.abc import AsyncIterator
from typing import Any

from ag_ui.core import EventType, StateSnapshotEvent
from ag_ui.encoder import EventEncoder
from pydantic import BaseModel


class AgentState(BaseModel):
    document: str = ""


WRITE_DOCUMENT_TOOL_SCHEMA: dict[str, Any] = {
    "name": "write_document",
    "description": "Write a document into shared agent state.",
    "input_schema": {
        "type": "object",
        "properties": {
            "document": {
                "type": "string",
                "description": "The full document text to render in shared state.",
            },
        },
        "required": ["document"],
    },
}


def _partial_json_string_property(source: str, key: str) -> str | None:
    """Return the current value of a streamed JSON string property."""
    marker = json.dumps(key)
    key_pos = source.find(marker)
    if key_pos < 0:
        return None
    colon_pos = source.find(":", key_pos)
    if colon_pos < 0:
        # The colon hasn't streamed yet (e.g. source is `{"document`); bail out
        # rather than letting find(":") return -1 and matching the key's own
        # opening quote, which would report the key name as the value.
        return None
    value_start = source.find('"', colon_pos + 1)
    if value_start < 0:
        return None

    raw_chars: list[str] = []
    escaped = False
    for char in source[value_start + 1 :]:
        if escaped:
            raw_chars.append("\\" + char)
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == '"':
            break
        else:
            raw_chars.append(char)

    try:
        return json.loads(f'"{"".join(raw_chars)}"')
    except json.JSONDecodeError:
        return None


async def stream_document_state(
    anthropic_stream: AsyncIterator[Any],
    state: AgentState,
) -> AsyncIterator[str]:
    encoder = EventEncoder()
    current_tool_name: str | None = None
    current_tool_args = ""
    last_streamed_document = state.document

    async for event in anthropic_stream:
        if (
            event.type == "content_block_start"
            and event.content_block.type == "tool_use"
        ):
            current_tool_name = event.content_block.name
            current_tool_args = ""
            continue

        if (
            event.type != "content_block_delta"
            or event.delta.type != "input_json_delta"
        ):
            continue

        current_tool_args += event.delta.partial_json
        if current_tool_name != "write_document":
            continue

        streamed_document = _partial_json_string_property(
            current_tool_args,
            "document",
        )
        if streamed_document is None or streamed_document == last_streamed_document:
            continue

        state.document = streamed_document
        last_streamed_document = streamed_document
        yield encoder.encode(
            StateSnapshotEvent(
                type=EventType.STATE_SNAPSHOT,
                snapshot=state.model_dump(),
            )
        )


```

See **[State streaming](/vue/claude-sdk-python/vue/shared-state/streaming)** for the full walkthrough, including the corresponding `useAgent` subscription on the frontend.

## Read-only context

When a value is **UI-owned** and the agent should read it but never write it back, such as current user, selected record, or scroll position, reach for `useAgentContext` instead of full shared state. It publishes values as a one-way UI-to-agent channel that auto-unregisters on unmount.

`useAgentContext` is a separate read-only capability; it does not replace the bidirectional `agent.state` / `agent.setState(...)` contract above.

See **[Agent read-only context](/vue/claude-sdk-python/vue/shared-state/agent-readonly)** for the full pattern.

<IntegrationGrid path="shared-state" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
