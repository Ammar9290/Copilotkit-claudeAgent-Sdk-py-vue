# Tool Call Rendering

> Render your agent's tool calls with custom UI components.

## What is this?

Tools are how an LLM invokes predefined, typically-deterministic functions. Tool rendering lets you decide how each of those tool calls appears in the chat. Instead of showing raw JSON, you register a Vue component that draws a branded card for the call (arguments, live status, and the eventual result). This is the **Generative UI** variant CopilotKit calls **tool rendering**.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive Agents with Generative UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/) — a free DeepLearning.AI short course taught by CopilotKit's CEO covering the full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

## When should I use this?

Render tool calls when you want to:

- Show users exactly what tools the agent is invoking and with what arguments
- Display live progress indicators while a tool executes
- Render rich, polished results once a tool completes
- Give tool-heavy agents a transparent, on-brand chat experience

## Default tool rendering (zero-config)

The simplest entry point is `useDefaultRenderTool()` with no arguments. CopilotKit registers its built-in default renderer as the `*` wildcard: every tool call renders as a status card (tool name, live **Running → Done** state, collapsible arguments/result) without you writing any UI.

Without this composable the runtime has no `*` renderer and tool calls are invisible; the user only sees the assistant's final text summary.

```vue title="src/components/AgentExperience.vue"
<script setup lang="ts">
import { CopilotChat, useDefaultRenderTool } from "@copilotkit/vue/v2";

useDefaultRenderTool();
</script>

<template><CopilotChat /></template>
```

## Custom catch-all

Once you want on-brand chrome, pass a `render` component or function to `useDefaultRenderTool`. It's a convenience wrapper around `useRenderTool({ name: "*", ... })`: one wildcard renderer handles every tool call, named or not.

```ts title="src/components/AgentExperience.vue"
useDefaultRenderTool({ render: BrandedToolCard });
```

## Per-tool renderers

The most expressive path is one renderer per tool name. Each renderer receives the tool's parsed arguments, a live `status`, and, once the agent returns, the `result`.

```vue title="src/components/WeatherToolCard.vue"
<script setup lang="ts">
defineProps<{
  parameters: { city?: string };
  status: "inProgress" | "executing" | "complete";
  result?: string;
}>();
</script>

<template>
  <p v-if="status !== 'complete'">Checking {{ parameters.city ?? "…" }}</p>
  <article v-else>
    <strong>{{ parameters.city }}</strong>
    <pre>{{ result }}</pre>
  </article>
</template>
```

```vue title="src/components/AgentExperience.vue"
<script setup lang="ts">
import { z } from "zod";
import { CopilotChat, useDefaultRenderTool, useRenderTool } from "@copilotkit/vue/v2";
import WeatherToolCard from "./WeatherToolCard.vue";

useRenderTool({
  name: "get_weather",
  parameters: z.object({ city: z.string() }),
  render: WeatherToolCard,
});

useDefaultRenderTool(); // wildcard fallback for every other tool
</script>

<template><CopilotChat /></template>
```

`parameters` is partial while arguments stream. Read required fields only after the status advances from `inProgress`. The result is a string when status is `complete`; parse it only if your backend deliberately returns a documented serialized shape.

<Callout type="info">
  The `name` you pass to `useRenderTool` must match the tool name the agent exposes; that's how the runtime routes the call to your component.
</Callout>

Per-tool renderers compose with a catch-all: named renderers claim the "interesting" tools and a wildcard handles everything else. The example registers the built-in wildcard after the named `get_weather` renderer.

If the renderer closes over reactive values, pass Vue watch sources as the second argument:

```ts
useRenderTool({ name: "get_weather", parameters, render: WeatherToolCard }, [locale]);
```

Finally, mount the registration component beneath the provider:

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import AgentExperience from "./components/AgentExperience.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit"><AgentExperience /></CopilotKitProvider>
</template>
```

## The backend tool definition

The frontend renderer only sees what the agent sends down. The matching backend must expose a tool named `get_weather`, return structured data, and let the frontend renderer with the same name paint the card. The Vue renderer does not create or execute that backend tool.

The agent must also register this schema as an executable backend tool. This
setup shows the connection.

<Steps>
  <Step>
    ### Register the backend tools

    `run_with_claude_agent_sdk` receives the tool schemas from the agent. It
    converts each schema to an SDK tool and creates an in-process MCP server.
    The adapter receives this server through `mcp_servers`. The matching
    `allowed_tools` entries give Claude permission to call the tools.

    
~~~~python title="claude_agent_sdk_adapter.py"
async def run_with_claude_agent_sdk(
    input_data: RunAgentInput,
    *,
    system_prompt: str,
    tools: list[dict[str, Any]],
    state: Any,
    model: str,
    execute_tool: ExecuteTool,
    max_turns: int = 10,
) -> AsyncIterator[str]:
    """Run through the official AG-UI Claude adapter and emit SSE chunks."""

    encoder = EventEncoder()
    state_box = {"state": state}
    pending_state_snapshots: list[Any] = []
    sdk_tools = _build_sdk_tools(
        tools,
        execute_tool=execute_tool,
        get_state=lambda: state_box["state"],
        set_state=lambda next_state: _set_state(
            next_state,
            state_box,
            pending_state_snapshots,
        ),
    )

    options: dict[str, Any] = {
        "model": _normalize_claude_agent_sdk_model(model),
        "system_prompt": system_prompt,
        "tools": [],
        "permission_mode": "dontAsk",
        "max_turns": max_turns,
    }

    if sdk_tools:
        options["mcp_servers"] = {
            COPILOTKIT_MCP_SERVER_NAME: create_sdk_mcp_server(
                COPILOTKIT_MCP_SERVER_NAME,
                "1.0.0",
                tools=sdk_tools,
            )
        }
        options["allowed_tools"] = [
            f"{COPILOTKIT_TOOL_PREFIX}{schema['name']}" for schema in tools
        ]

    adapter = ClaudeAgentAdapter(
        name="claude-sdk-python",
        options=options,
    )
    run_input = _with_initial_state(input_data, state)

    async for event in adapter.run(run_input):
        if event.type == EventType.TOOL_CALL_RESULT and pending_state_snapshots:
            yield encoder.encode(
                StateSnapshotEvent(
                    type=EventType.STATE_SNAPSHOT,
                    snapshot=pending_state_snapshots.pop(0),
                )
            )
        yield encoder.encode(event)


~~~~

  </Step>

  <Step>
    ### Call the CopilotKit tool handler

    Each `sdk_tool_handler` calls the executable CopilotKit handler for its
    schema. It returns the handler result to Claude as MCP tool content.

    
~~~~python title="claude_agent_sdk_adapter.py"
def _make_sdk_tool(
    schema: dict[str, Any],
    *,
    execute_tool: ExecuteTool,
    get_state: Callable[[], Any],
    set_state: Callable[[Any], None],
) -> Any:
    name = schema["name"]
    description = schema.get("description", "")
    input_schema = schema.get("input_schema", {"type": "object", "properties": {}})

    @sdk_tool(name, description, input_schema)
    async def sdk_tool_handler(args: dict[str, Any]):
        try:
            # Offload to a worker thread: execute_tool may run a synchronous
            # anthropic.Anthropic() LLM round-trip (the generate_a2ui branch),
            # which would otherwise block the uvicorn event loop and wedge the
            # :8000 /health endpoint under load.
            result_text, next_state = await asyncio.to_thread(
                execute_tool,
                name,
                dict(args or {}),
                get_state(),
                None,
            )
            if next_state is not None:
                set_state(next_state)
            return {"content": [{"type": "text", "text": result_text}]}
        except Exception as exc:
            return {
                "content": [{"type": "text", "text": str(exc)}],
                "is_error": True,
            }

    return sdk_tool_handler


~~~~

  </Step>
</Steps>

<Callout type="info">
  This MCP path handles compatible requests that use backend tools only.
  Requests with frontend tools or structured user content use the direct
  Anthropic path. Requests with aimock transport also use this fallback.
</Callout>

```python
# src/app/demos/tool-rendering/weather_tool.snippet.py
from typing import Any


# Anthropic tool schema — passed via the `tools` parameter on
# `client.messages.create(...)` / `.stream(...)`. Claude calls this
# tool by name; the runtime dispatches to the matching handler below.
GET_WEATHER_TOOL: dict[str, Any] = {
    "name": "get_weather",
    "description": (
        "Get the current weather for a given location. Useful on its "
        "own for weather questions, and a great companion to "
        "`search_flights` — always consider checking the weather at a "
        "destination the user is flying to."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The city or region to get weather for.",
            },
        },
        "required": ["location"],
    },
}


def get_weather(location: str) -> dict[str, Any]:
    """Handler invoked when Claude calls the `get_weather` tool."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }


```

<IntegrationGrid path="generative-ui/tool-rendering" />
