/** Worker D — Generative UI › Open-Ended, Tool Rendering, Component as tool; App Control.
 *
 * Each entry is one doc route. Edit only this file for this section. */
import { P, type RouteMeta } from "./types";

const GEN = "frontend/src/pages/generative-ui";

export const openEnded: RouteMeta[] = [
  {
    path: "/generative-ui/mcp-apps",
    title: "MCP Apps",
    docPath: "generative-ui/mcp-apps",
    summary:
      "A runtime with one `mcpApps.servers` entry (Excalidraw's public MCP App, pinned `serverId`) and a plain `CopilotChat`. The MCP server's UI tools are added to the run, and the built-in renderer draws the tool's UI resource as a sandboxed iframe.",
    status: "working",
    statusNote:
      "Verified: the agent called the Excalidraw MCP App's tool and the whiteboard iframe rendered inline with the diagram. Needs internet for the public server.",
    hasDemo: true,
    agentId: "generative-ui-mcp-apps",
    runtimePath: "/api/copilotkit-section-d-mcp-apps",
    tryIt: {
      prompts: ["Draw a simple flowchart on the whiteboard: Idea → Build → Ship."],
      expect: "An Excalidraw iframe with the diagram renders inline in the chat. The run ends at the tool call, so no assistant text follows it.",
      fail: "Text only (the agent never called the MCP App's tool), or an error because the public server can't be reached.",
    },
    sources: P(
      "/generative-ui/mcp-apps",
      "frontend/runtime/endpoints/section-d-mcp-apps.ts",
      "backend/src/agents/routes/section_d.py",
    ),
    notes: [
      {
        title: "Which MCP server",
        tone: "info",
        html: "The page's runtime sample uses the placeholder <code>https://mcp.example.com/mcp</code>. This harness points at <code>https://mcp.excalidraw.com/mcp</code> (serverId <code>excalidraw</code>), the first server in the page's \"Example MCP servers\" list, so the demo needs internet access. Set <code>MCP_APPS_SERVER_URL</code> / <code>MCP_APPS_SERVER_ID</code> on the runtime process to use another server.",
      },
      {
        title: "How the Python agent sees the MCP tools",
        tone: "info",
        html: "The runtime's MCP Apps middleware adds the server's UI tools to the run's <code>tools</code>. The Python adapter treats them like any frontend tool: it serves them from its <code>ag_ui</code> MCP server and ends the run when Claude calls one. The middleware then runs the call against the MCP server and emits the <code>mcp-apps</code> activity that the Vue renderer draws. No backend configuration is needed.",
      },
    ],
  },
  {
    path: "/generative-ui/open-generative-ui",
    title: "Open Generative UI",
    docPath: "generative-ui/open-generative-ui",
    summary:
      "`openGenerativeUI: { agents: [\"open-gen-ui\"] }` on the runtime. The agent calls the injected `generateSandboxedUi` tool and its HTML/CSS/JS streams into a sandboxed iframe. The page's two sandbox functions (`evaluateExpression`, `notifyHost`) are passed to the Vue provider.",
    status: "working",
    statusNote:
      "Verified: a greeting card streamed into the sandboxed iframe, and a generated panel called the host's notifyHost sandbox function (host console logged it, the panel showed receivedAt).",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "open-gen-ui",
    runtimePath: "/api/copilotkit-section-d-ogui",
    tryIt: {
      prompts: ["Build me a simple greeting card."],
      expect: "A sandboxed preview builds live in the chat: styles first, then HTML, then scripts.",
      fail: "Nothing renders and no error appears, which means the model never saw `generateSandboxedUi`.",
    },
    sources: P(
      "/generative-ui/open-generative-ui",
      `${GEN}/open-generative-ui/sandbox-functions.ts`,
      "frontend/runtime/endpoints/section-d-ogui.ts",
      "backend/src/agents/routes/section_d.py",
    ),
    notes: [
      {
        title: "React-only page, ported to Vue",
        tone: "info",
        html: "The page's frontend samples are React (<code>&lt;CopilotKit openGenerativeUI={…}&gt;</code>). The Vue <code>CopilotKitProvider</code> takes the same <code>openGenerativeUI</code> prop (<code>sandboxFunctions</code>, <code>designSkill</code>), so the demo passes it there. The minimal cell's <code>designSkill: VISUALIZATION_DESIGN_SKILL</code> is skipped because the page never publishes that constant; the default design skill is used.",
      },
      {
        title: "Sandbox function types",
        tone: "warn",
        html: "The page's <code>openGenUiSandboxFunctions</code> have typed handlers (<code>({ expression }: { expression: string })</code>). Vue 1.87.0 types <code>SandboxFunction.handler</code> as <code>(args: unknown) =&gt; unknown</code>, so the array as published fails <code>vue-tsc</code>. The demo widens the type with a cast; the runtime value is unchanged.",
      },
    ],
  },
];

export const toolUi: RouteMeta[] = [
  {
    path: "/generative-ui/state-rendering",
    title: "State Rendering",
    docPath: "generative-ui/state-rendering",
    summary:
      "A `ResearchProgress` component reads `agent.value.state` through `useAgent({ agentId: \"researcher\", updates: [OnStateChanged, OnRunStatusChanged] })` and renders `status`, a `<progress>` from `completed`/`total`, and `draft`, above `<CopilotChat agent-id=\"researcher\" />`. The page's Python backend is the shared `state_streaming_backend.snippet.py`: `stream_document_state` walks a raw Anthropic Messages API stream and emits STATE_SNAPSHOT `{document}` as the `write_document` argument streams. It is not ClaudeAgentAdapter.",
    status: "broken",
    statusNote:
      "Every run ends in RUN_ERROR \"TypeError: \\\"Could not resolve authentication method. Expected one of api_key, auth_token, or credentials to be set. Or for the `Authorization` header to be explicitly omitted\\\"\": the page's raw Anthropic loop needs ANTHROPIC_API_KEY, which this machine doesn't have. Even with a key, the page's component reads status/draft/completed/total, but its backend writes only `document`.",
    hasDemo: true,
    agentId: "researcher",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Draft a one-paragraph product brief for a habit-tracking app."],
      expect:
        "Per the page: the panel above the chat updates while the agent works. With this backend the only key that could change is `document`. It would appear in the raw agent.state dump, while ResearchProgress stays on “Idle” with an empty bar.",
      fail:
        "What happens here: no reply. The raw events show RUN_STARTED, then RUN_ERROR “Could not resolve authentication method…”. ResearchProgress stays on “Idle”.",
    },
    sources: P(
      "/generative-ui/state-rendering",
      `${GEN}/state-rendering/ResearchProgress.vue`,
      "backend/src/agents/section_g/state_streaming_backend.py",
      "backend/src/agents/section_g/state_streaming_agent.py",
      "backend/src/agents/routes/section_g.py",
    ),
    notes: [
      {
        title: "The page's backend is a raw Messages API stream handler, built as printed",
        tone: "info",
        html: "<code>state_streaming_backend.py</code> is the page's <code>state_streaming_backend.snippet.py</code>, verbatim: <code>AgentState</code>, <code>WRITE_DOCUMENT_TOOL_SCHEMA</code>, <code>_partial_json_string_property</code> and <code>stream_document_state(anthropic_stream, state)</code>. The page's <code>agent.py</code> excerpt is the same branch. The handler reads <code>content_block_start</code> / <code>input_json_delta</code> events off an Anthropic SDK stream. <code>ClaudeAgentAdapter</code> never exposes one, so this route does not use the adapter. Its built-in <code>ag_ui_update_state</code> tool was <em>not</em> swapped in, because that would replace the page's mechanism.",
      },
      {
        title: "Observed failure: no Anthropic API key",
        tone: "warn",
        html: "<code>import anthropic</code> works in this run (anthropic 2.8.0, <code>jiter</code> loads). <code>anthropic.AsyncAnthropic()</code> then needs <code>ANTHROPIC_API_KEY</code>. <code>backend/.env</code> has none, and the Claude Code CLI login that the adapter routes use does not authenticate the raw Messages API. The first <code>messages.stream</code> call fails with <code>TypeError: \"Could not resolve authentication method. Expected one of api_key, auth_token, or credentials to be set. Or for the `Authorization` header to be explicitly omitted\"</code>, which reaches the browser as an AG-UI <code>RUN_ERROR</code>. This is not worked around. The module is still imported per request, so a blocked <code>anthropic</code> import (README §8) would also surface as a <code>RUN_ERROR</code>.",
      },
      {
        title: "The page's frontend and backend don't share a key",
        tone: "warn",
        html: "<code>ResearchProgress.vue</code> reads <code>status</code>, <code>draft</code>, <code>completed</code> and <code>total</code>. The only backend the page prints is the State Streaming snippet, which writes <code>document</code> and nothing else. Both are kept as published. With a working key the run would stream <code>document</code> into state, visible in the raw <code>agent.state</code> dump, while the component stays on “Idle” with an empty bar.",
      },
      {
        title: "Gaps filled (NOT DOC CODE)",
        tone: "warn",
        html: "The page never shows what opens <code>anthropic_stream</code>, what frames the AG-UI run, or which endpoint serves it. <code>state_streaming_agent.py</code> is a minimal loop: RUN_STARTED, one <code>client.messages.stream(..., tools=[WRITE_DOCUMENT_TOOL_SCHEMA])</code> turn passed unchanged into <code>stream_document_state</code>, the assistant's text, then RUN_FINISHED. It has no tool_result round trip. The system prompt is repo-authored. <code>routes/section_g.py</code> mounts it with <code>register(app)</code> at <code>POST /generative-ui-state-rendering</code>. That route is absent from <code>/health</code>, so <code>/api/copilotkit</code> cannot discover it. <code>Demo.vue</code> therefore adds the page's agent id <code>researcher</code> as a local <code>HttpAgent</code> (<code>agents__unsafe_dev_only</code>, through Vite's <code>/agent</code> proxy) and keeps the page's <code>runtime-url</code>. The raw-events panel is a debug aid.",
      },
    ],
  },
  {
    path: "/generative-ui/tool-rendering",
    title: "Tool Rendering",
    docPath: "generative-ui/tool-rendering",
    summary:
      "A per-tool `useRenderTool` card for the backend `get_weather` tool (an in-process MCP tool on the Python adapter), plus `useDefaultRenderTool()` as the wildcard.",
    status: "partial",
    statusNote:
      "The backend tool runs and useDefaultRenderTool's wildcard card renders, but it's labelled mcp__weather__get_weather: ag_ui_claude_sdk 0.2.4 only strips the mcp__ag_ui__ prefix, so useRenderTool({ name: \"get_weather\" }) never matches and WeatherToolCard never renders.",
    hasDemo: true,
    agentId: "generative-ui-tool-rendering",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["What's the weather in Tokyo?"],
      expect: "Per the page: the WeatherToolCard shows \"Checking …\", then the JSON result. Observed: the default wildcard card titled mcp__weather__get_weather (Running → Done) renders instead, then the agent's prose.",
      fail: "No tool card at all: the wildcard renderer did not register or the backend tool was denied.",
    },
    sources: P(
      "/generative-ui/tool-rendering",
      `${GEN}/tool-rendering/AgentExperience.vue`,
      `${GEN}/tool-rendering/WeatherToolCard.vue`,
      "backend/src/agents/section_d/weather_tool.py",
      "backend/src/agents/section_d/weather_mcp.py",
      "backend/src/agents/routes/section_d.py",
    ),
    notes: [
      {
        title: "Backend bridge (NOT DOC CODE)",
        tone: "warn",
        html: "The page shows <code>run_with_claude_agent_sdk</code> passing tool schemas to <code>_build_sdk_tools</code> / <code>_make_sdk_tool</code>, but never defines <code>execute_tool</code> or the server-name constants. <code>weather_mcp.py</code> is the smallest version of that same wiring for the one published tool: <code>tool()</code> + <code>create_sdk_mcp_server()</code>, passed through <code>mcp_servers</code>, with <code>mcp__weather__get_weather</code> in <code>allowed_tools</code>. The tool schema and handler (<code>weather_tool.py</code>) are the page's, unchanged.",
      },
      {
        title: "Observed failure: the per-tool renderer never matches",
        tone: "warn",
        html: "The tool-call event reaches the browser as <code>data-tool-name=\"mcp__weather__get_weather\"</code>, args <code>{\"location\":\"Tokyo\"}</code>. <code>ag_ui_claude_sdk</code> 0.2.4's <code>strip_mcp_prefix</code> only removes <code>mcp__ag_ui__</code> (its docstring: \"preserve native MCP names\"), so a backend tool on any other MCP server keeps its prefix. <code>useRenderTool({ name: \"get_weather\" })</code> therefore never matches and only the <code>useDefaultRenderTool()</code> wildcard card appears. Not worked around: renaming the tool server or the renderer would no longer be the page's code.",
      },
      {
        title: "The page's renderer reads a field its backend tool doesn't send",
        tone: "warn",
        html: "The page's <code>WeatherToolCard</code> reads <code>parameters.city</code> and its <code>useRenderTool</code> schema is <code>z.object({ city })</code>, but its published <code>GET_WEATHER_TOOL</code> takes <code>location</code>. Both are kept as published. Even if the name matched, the card's city label would stay empty (\"Checking …\" and a blank heading) while the JSON result, which does contain <code>city</code>, rendered below it.",
      },
    ],
  },
  {
    path: "/generative-ui/tool-based",
    title: "Component as tool",
    docPath: "generative-ui/tool-based",
    summary:
      "`useComponent({ name: \"show_weather\", parameters, render: WeatherCard })`. The component is registered as a frontend tool, and when the agent calls it the card renders inline with the arguments as props.",
    status: "working",
    statusNote:
      "Verified: the agent called show_weather and the WeatherCard rendered inline (\"Lisbon \u00b7 18\u00b0 \u00b7 Partly Cloudy\").",
    hasDemo: true,
    agentId: "generative-ui-tool-based",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show me the weather in Lisbon."],
      expect: "A WeatherCard with the city, temperature and condition renders inline in the chat.",
      fail: "The agent describes the weather in prose and no card appears.",
    },
    sources: P(
      "/generative-ui/tool-based",
      `${GEN}/tool-based/AgentExperience.vue`,
      `${GEN}/tool-based/WeatherCard.vue`,
      "backend/src/agents/routes/section_d.py",
    ),
    notes: [
      {
        title: "Agent prompt",
        tone: "info",
        html: "The agent has no weather data, so its system prompt (repo-authored) tells it to show weather with <code>show_weather</code> and make up plausible values. The tool itself reaches the agent only through the run's frontend tools.",
      },
      {
        title: "Vue warnings while arguments stream",
        tone: "info",
        html: "The page's <code>WeatherCard</code> declares all three props as required, and the card renders while the arguments are still streaming in. Vue logs <code>[Vue warn]: Missing required prop: \"temperature\"</code> / <code>\"condition\"</code> until the call completes. These are warnings only; the finished card is correct.",
      },
    ],
  },
];

export const appControl: RouteMeta[] = [
  {
    path: "/frontend-tools",
    title: "Frontend Tools",
    docPath: "frontend-tools",
    summary:
      "`useFrontendTool` registers `filter_incidents`. Its handler runs in the browser, sets the `severity` ref, and the incident list beside the chat re-filters.",
    status: "working",
    statusNote:
      "Verified: filter_incidents ran in the browser, \"Current filter\" switched to sev1 and the list re-filtered.",
    hasDemo: true,
    agentId: "frontend-tools",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show me only sev1 incidents.", "Reset the filter to all."],
      expect: "\"Current filter\" changes and the incident list on the left re-filters, then the agent confirms.",
      fail: "The agent says it filtered, but the list doesn't change.",
    },
    sources: P(
      "/frontend-tools",
      "frontend/src/pages/frontend-tools/DashboardAgent.vue",
      "backend/src/agents/routes/section_d.py",
    ),
    notes: [
      {
        title: "What is repo-authored",
        tone: "info",
        html: "The <code>useFrontendTool</code> call is the page's, unchanged. The page shows only <code>Current filter: {{ severity }}</code>; the five sample incidents and the filtered list are added so the effect is visible.",
      },
      {
        title: "Odd follow-up reply",
        tone: "info",
        html: "After the handler's result goes back, the agent's follow-up turn often reads like it was asked to \"continue\" (observed: \"There's no prior task to continue — … the sev3 filter request, which is done.\"). The filter itself is applied correctly. This comes from how the Python adapter resumes after a frontend tool result; it was left as is.",
      },
    ],
  },
];
