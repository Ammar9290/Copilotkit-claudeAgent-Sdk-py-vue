# State Streaming

> Stream partial agent state updates to the UI while a tool call is still running.

## What is this?

By default, agent state only updates *between* backend checkpoints, so a long-running tool call, such as writing a full document or drafting an email, appears to the UI as one big burst at the end. For agent-native apps, that feels broken: users expect to watch the output materialize.

**State streaming** forwards the value of a specific tool argument straight into an agent state key *as the argument is being generated*. The UI, subscribed through `useAgent`, re-renders every token.

## When should I use this?

Use state streaming whenever a tool's output is long-form text or a growing structured value and you want the user to see it assemble in real time. Common shapes:

- A collaborative writing agent that emits a document
- A research agent that accumulates a list of findings
- A planning agent that builds up a step-by-step plan

Without streaming, the user stares at a spinner. With streaming, they see the answer grow token-by-token.

## The backend: one streaming state mapping

<Steps>
  <Step>
    ### Stream partial state updates while Claude responds

    For streaming state, parse the agent's structured deltas as they arrive and
    emit CopilotKit state updates before the final message is complete. This
    branch runs inside the streamed tool-argument handler.

    
~~~~python title="agent.py"
                            if current_tool_name == "write_document":
                                streamed_document = _partial_json_string_property(
                                    current_tool_args,
                                    "document",
                                )
                                if (
                                    streamed_document is not None
                                    and streamed_document != last_streamed_document
                                ):
                                    state.document = streamed_document
                                    last_streamed_document = streamed_document
                                    yield encoder.encode(
                                        StateSnapshotEvent(
                                            type=EventType.STATE_SNAPSHOT,
                                            snapshot=state.model_dump(),
                                        )
                                    )
~~~~

  </Step>
</Steps>

The backend pattern is always the same: map one streaming tool argument to one shared-state key. Middleware-backed frameworks usually expose this as a declarative mapping. Direct SDK adapters do the same work in their streaming loop by parsing partial tool arguments and emitting `STATE_SNAPSHOT` whenever the mapped value changes. When the LLM streams that argument, CopilotKit writes every partial value into shared state before the tool finishes executing.

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

A few things to note:

- The state key must exist in your agent state (`document` in this example).
- The tool and argument names must match the exact LLM-facing tool call you want to forward.
- When the tool call completes, its final return value is written to the same key, so the streamed partial eventually becomes the authoritative final value.

## The frontend: useAgent + OnStateChanged

The UI side is identical to any other shared-state subscription: `useAgent` with `OnStateChanged` gives you a reactive `agent.value.state`. Add `OnRunStatusChanged` if you want a live/done indicator.

```vue title="src/components/StreamingDocument.vue"
<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type DocumentState = { document?: string };

const { agent } = useAgent({
  agentId: "writer",
  updates: [
    UseAgentUpdate.OnStateChanged,
    UseAgentUpdate.OnRunStatusChanged,
  ],
});
const state = computed(
  () => (agent.value?.state ?? {}) as DocumentState,
);
</script>

<template>
  <article aria-live="polite">
    <span v-if="agent?.isRunning">LIVE</span>
    <p>{{ state.document ?? "Waiting for a draft…" }}</p>
  </article>
</template>
```

From there, `state.document` is a string that grows on every token, and `agent.isRunning` tells you whether to show a streaming indicator.

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import StreamingDocument from "./components/StreamingDocument.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <StreamingDocument />
    <CopilotChat agent-id="writer" />
  </CopilotKitProvider>
</template>
```

If the runtime does not emit partial state snapshots, the UI sees only the final state. The Vue frontend cannot invent updates the backend never sends.

## Related

- **[Shared State (overview)](/vue/claude-sdk-python/vue/shared-state)** — the bidirectional read and write pattern this extends.
- **[Agent read-only context](/vue/claude-sdk-python/vue/shared-state/agent-readonly)** — for the inverse UI-to-agent one-way channel.

<IntegrationGrid path="shared-state/streaming" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
