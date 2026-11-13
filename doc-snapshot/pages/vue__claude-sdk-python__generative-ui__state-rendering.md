# State Rendering

> Render your agent's state with custom UI components in real-time.

## What is this?

State rendering lets you build UI that reflects your agent's state in real-time. As your agent progresses through nodes and emits state updates, your frontend renders those changes, showing progress, drafts, or intermediate results.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive Agents with Generative UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/) — a free DeepLearning.AI short course taught by CopilotKit's CEO covering the full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

## When should I use this?

Use state rendering when you want to:

- Show real-time progress (e.g. "Researching... 2/5 complete")
- Display drafts that update as the agent works
- Build dashboards that reflect agent state
- Render structured output outside of the chat

## How it works in code

On the frontend, subscribe to the agent's state. Each time the backend forwards a fresh value, your component re-renders with the latest partial output. `useAgent` returns an `agent` ref; read `agent.value?.state` in script or let templates unwrap the ref. Keep the provider in an ancestor SFC.

```vue title="src/components/ResearchProgress.vue"
<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type ResearchState = { status?: string; draft?: string; completed?: number; total?: number };

const { agent } = useAgent({
  agentId: "researcher",
  updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
});

const state = computed(() => (agent.value?.state ?? {}) as ResearchState);
</script>

<template>
  <section aria-live="polite">
    <p>{{ state.status ?? "Idle" }}</p>
    <progress :value="state.completed ?? 0" :max="state.total ?? 1" />
    <article v-if="state.draft">{{ state.draft }}</article>
  </section>
</template>
```

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import ResearchProgress from "./components/ResearchProgress.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <ResearchProgress />
    <CopilotChat agent-id="researcher" />
  </CopilotKitProvider>
</template>
```

On the backend, a state-streaming mapping forwards a specific tool argument straight into a state key *as it's being generated*. Some frameworks provide that as middleware; direct SDK adapters can emit `STATE_SNAPSHOT` events from their streaming loop. Either way, the UI can watch the answer assemble token-by-token rather than appearing in one burst between checkpoints.

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

Treat agent state as untrusted external data. Validate it before using it for privileged actions, and avoid putting secrets in state that is streamed to the browser.

<IntegrationGrid
  path="generative-ui/state-rendering"
  exclude={["agno", "agent-spec"]}
/>
