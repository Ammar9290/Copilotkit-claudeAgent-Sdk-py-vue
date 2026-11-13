/** Worker F — Built-in Agent, Runtime.
 *
 * Each entry is one doc route. Edit only this file for this section. */
import { P, type RouteMeta } from "./types";

const PY = "backend/src/agents/routes/section_f.py";
const RAW = "frontend/src/pages/backend/RawEvents.vue";

/** Built-in Agent sub-pages: probed 2026-11-12, all 404 under /vue/claude-sdk-python. */
const notAvailable = (slug: string, title: string, neutral: string): RouteMeta => ({
  path: `/built-in-agent/${slug}`,
  title,
  docPath: `built-in-agent/${slug}`,
  summary: "No Vue + Claude Agent SDK (Python) version of this page exists.",
  status: "not-available",
  statusNote: `404 at /vue/claude-sdk-python/built-in-agent/${slug}.md and at /vue/claude-sdk-python/${slug}.md. It exists only in the framework-neutral Built-in Agent docs (${neutral}) and under /angular.`,
  offNav: true,
});

export const builtInAgent: RouteMeta[] = [
  {
    path: "/built-in-agent",
    title: "Built-in Agent",
    docPath: "built-in-agent",
    summary:
      "A `BuiltInAgent({ model, prompt, tools })` built inside the Copilot Runtime and registered as `default`. The agent loop runs in the Node runtime process. No Python agent server is involved.",
    status: "partial",
    statusNote:
      "The agent is registered and /info lists it as className: \"BuiltInAgent\", and a run starts. The model call then fails: RUN_ERROR \"Anthropic API key is missing. Pass it using the 'apiKey' parameter or the ANTHROPIC_API_KEY environment variable.\" It would run with ANTHROPIC_API_KEY set in the runtime's environment.",
    hasDemo: true,
    agentId: "default (BuiltInAgent, Node)",
    runtimePath: "/api/copilotkit-section-f-bia",
    tryIt: {
      prompts: ["What time is it in Tokyo?"],
      expect:
        "The top bar reads `default → BuiltInAgent`. With an Anthropic key, the agent would call the `getServerTime` server tool and answer. In this harness the raw events panel shows RUN_STARTED followed by RUN_ERROR naming the missing ANTHROPIC_API_KEY, and the Inspector shows \"Agent run failed\".",
      fail: "No RUN_STARTED at all, or the info line shows an error: the runtime endpoint did not load.",
    },
    sources: P("/built-in-agent", "frontend/runtime/endpoints/section-f-bia.ts", RAW),
    notes: [
      {
        title: "The Vue page is a placeholder summary",
        tone: "info",
        html: "The only API it names is <code>BuiltInAgent({ model, tools, prompt })</code> running inside the runtime. Everything else is a TODO comment and a link to the framework-neutral BIA docs. So the demo builds exactly that: one model string, a prompt, and one <code>defineTool</code> server tool, with no agent server behind it. Its seven sub-pages (Server Tools, MCP servers, Advanced Configuration, Model Selection and the per-provider pages) all 404 under <code>/vue/claude-sdk-python</code>.",
      },
      {
        title: "Needs a model key the harness doesn't have",
        tone: "warn",
        html: "The Python agents authenticate through the Claude Code CLI login. A BuiltInAgent resolves <code>anthropic/claude-sonnet-4-6</code> through the AI SDK inside Node, and that path only reads <code>ANTHROPIC_API_KEY</code>. No key is set, so the failure is left visible: no fallback agent is swapped in.",
      },
    ],
  },
  notAvailable("server-tools", "Server Tools", "/server-tools"),
  notAvailable("mcp-servers", "MCP servers", "/mcp-servers"),
  notAvailable("advanced-configuration", "Advanced Configuration", "/advanced-configuration"),
  notAvailable("model-selection", "Model Selection", "/model-selection"),
  notAvailable("model-selection/openai", "OpenAI", "/model-selection"),
  notAvailable("model-selection/anthropic", "Anthropic", "/model-selection"),
  notAvailable("model-selection/google", "Google", "/model-selection"),
];

export const runtime: RouteMeta[] = [
  {
    path: "/backend/copilot-runtime",
    title: "Copilot Runtime",
    docPath: "backend/copilot-runtime",
    summary:
      "The page's runtime with an explicit `InMemoryAgentRunner`, with the Python agent registered under the key `default`. Three modes: through the runtime (`<CopilotChat />` with no agent-id), a direct AG-UI connection (`HttpAgent` + `agents__unsafe_dev_only`), and `forwardHeaders` inspected with a header-echo endpoint. Each mode shows the raw AG-UI events.",
    status: "working",
    statusNote:
      "Verified in the browser: the default-key chat, the direct agents__unsafe_dev_only chat, and header forwarding. x-internal-debug and x-acme-* are denied, x-request-id is stripped by the default denylist, and the server-set X-Tenant-Id beats the browser's.",
    hasDemo: true,
    agentId: "section-f-copilot-runtime (key: default)",
    runtimePath: "/api/copilotkit-section-f-runtime",
    tryIt: {
      prompts: [
        "Reply with exactly: pong",
        "(Header forwarding) which headers arrived?",
        "(Header forwarding, header-echo-server) again",
      ],
      expect:
        "Through the runtime: the reply streams and the raw panel shows RUN_STARTED … TEXT_MESSAGE_* … RUN_FINISHED. Direct: the same events, but the request goes to /agent/section-f-copilot-runtime and never touches /api. Header forwarding: the reply lists only `authorization` and `x-tenant-id: from-the-browser`. With header-echo-server selected, it lists `x-tenant-id: set-on-the-server`.",
      fail: "CopilotKitAgentDiscoveryError in the runtime mode means `default` is not registered. If denied headers appear in the echo, the forwardHeaders policy was not applied.",
    },
    sources: P(
      "/backend/copilot-runtime",
      "frontend/runtime/endpoints/section-f-runtime.ts",
      RAW,
      PY,
    ),
    notes: [
      {
        title: "Mounting adapter",
        tone: "info",
        html: "The page mounts the runtime with Next.js and <code>createCopilotRuntimeHandler</code>. Here every endpoint is mounted by <code>frontend/server.ts</code> with <code>createCopilotNodeListener</code> (the Vue Quickstart's adapter), which serves the same multi-route tree. The runtime options (<code>agents</code>, <code>runner</code>, <code>forwardHeaders</code>, <code>sseKeepAliveIntervalSeconds</code>) are the page's.",
      },
      {
        title: "Header-echo endpoint (NOT DOC CODE)",
        tone: "warn",
        html: "A Claude agent never sees HTTP headers. To make the forwarding rules visible, <code>section_f.py</code>'s <code>register(app)</code> adds <code>POST /section-f-header-echo</code>. It is a minimal AG-UI SSE responder, not an LLM, and it replies with the <code>authorization</code> and <code>x-</code> headers it received. The runtime binds it twice: once bare and once with <code>HttpAgent({ headers: { \"X-Tenant-Id\": … } })</code>, the setup for the page's \"Server-configured headers win\" rule.",
      },
      {
        title: "Direct connection goes through Vite's /agent proxy",
        tone: "info",
        html: "The page's <code>new HttpAgent({ url: \"https://my-agent.example.com\" })</code> becomes <code>/agent/section-f-copilot-runtime</code>, which Vite forwards to the Python server, so the agent server needs no CORS. The provider key is the page's <code>'my-agent'</code>.",
      },
    ],
  },
  {
    path: "/backend/runtime-endpoints",
    title: "Runtime HTTP endpoints",
    docPath: "backend/runtime-endpoints",
    summary:
      "Every route in the page's multi-route table, called from the browser against a real runtime: info, agent run, connect and stop, the thread routes, inspector-metadata and transcribe. The run response is shown as raw AG-UI events from the Python agent. The same runtime is also mounted in `mode: \"single-route\"`, with a chat that discovers that transport on its own.",
    status: "partial",
    statusNote:
      "Every route answers. Two differ from the page: on 1.87.0 GET /threads and POST /threads/clear return 403 thread_access_not_configured (\"Listing and clearing threads need a caller identity…\") instead of listing every thread and answering 204. Everything else matches: /info 200, run SSE, connect replay, unknown agent 404, stop 200/400, messages/events/state 200, inspector-metadata 204, transcribe 503, single-route envelope 200.",
    hasDemo: true,
    agentId: "section-f-runtime-endpoints (key: runtime-endpoints)",
    runtimePath: "/api/copilotkit-section-f-runtime",
    tryIt: {
      prompts: [
        "(click) Send on \"Start a run\", then Send on each thread route",
        "(right-hand chat) Say hello in five words.",
      ],
      expect:
        "\"Start a run\" shows HTTP 200 and a list of AG-UI events from RUN_STARTED to RUN_FINISHED. \"Connect\" replays the same thread. Unregistered agent gives 404 `Agent not found`. Invalid stop body gives 400. messages/events/state give 200. The single-route envelope returns runtime info, and the single-route chat answers.",
      fail: "404 on /info means the basePath doesn't match. A run that ends in RUN_ERROR means the Python agent server is not reachable.",
    },
    sources: P(
      "/backend/runtime-endpoints",
      "frontend/runtime/endpoints/section-f-runtime.ts",
      "frontend/runtime/endpoints/section-f-single.ts",
    ),
    notes: [
      {
        title: "Thread list / clear are closed by default on 1.87.0",
        tone: "warn",
        html: "The page and the AgentRunner page say that on the in-memory runner <code>GET /threads</code> lists every thread in the process and <code>POST /threads/clear</code> always answers 204. On <code>@copilotkit/runtime@1.87.0</code> both return <b>403</b> <code>thread_access_not_configured</code> unless the runtime has <code>identifyUser</code> or <code>threads: { access: \"open\" }</code>. Neither option appears on the page. The runtime also logs this at startup. Left as the page prescribes.",
      },
      {
        title: "Single-route discovery costs one 405",
        tone: "info",
        html: "With <code>use-single-endpoint</code> omitted, the Vue provider first tries <code>GET {base}/info</code>. The single-route mount answers 405 (<code>Method not allowed</code>), and the provider then switches to the <code>POST {\"method\":\"info\"}</code> envelope. The chat works. The 405 shows up once in the console on page load.",
      },
    ],
  },
  {
    path: "/backend/custom-agent",
    title: "Use any model router",
    docPath: "backend/custom-agent",
    summary:
      "BuiltInAgent factory mode, using the page's own code: the AI SDK, TanStack AI and Custom Quick Start tabs, the Custom With Tools example, and the AI SDK reasoning example. Each is registered under its own key and picked in the demo. A raw-event panel shows what each factory streamed.",
    status: "partial",
    statusNote:
      "Only the Custom With Tools factory (fixed AG-UI events, no model) completes: getWeather tool call, then \"The weather in San Francisco is 72°F.\" The others fail at run time. AI SDK: \"OpenAI API key is missing…\". TanStack: \"OPENAI_API_KEY is not set…\". Reasoning: \"Anthropic API key is missing…\". Custom: \"fetch failed\" (placeholder host). They need OPENAI_API_KEY / ANTHROPIC_API_KEY in the runtime's environment.",
    hasDemo: true,
    agentId: "aisdk · tanstack · custom · custom-tools · aisdk-reasoning (BuiltInAgent, Node)",
    runtimePath: "/api/copilotkit-section-f-router",
    tryIt: {
      prompts: ["What's the weather in San Francisco?"],
      expect:
        "custom-tools: the raw panel shows TOOL_CALL_START/ARGS/END/RESULT for getWeather, and the chat says \"The weather in San Francisco is 72°F.\" Every other factory: RUN_STARTED followed by a RUN_ERROR naming the missing key, or \"fetch failed\".",
      fail: "No events at all: the router endpoint failed to load.",
    },
    sources: P("/backend/custom-agent", "frontend/runtime/endpoints/section-f-router.ts", RAW),
    notes: [
      {
        title: "Doc code that doesn't type-check against the installed packages",
        tone: "warn",
        html: "Two samples are kept verbatim, each with a <code>@ts-expect-error</code> explaining why. They run under tsx regardless. (1) AI SDK With Tools: <code>convertToolsToVercelAITools()</code> returns the <code>ToolSet</code> of the <code>ai</code> copy nested under <code>@copilotkit/runtime</code>, which the app's <code>ai@7</code> <code>streamText</code> rejects (\"Property '[schemaSymbol]' is missing\"). (2) TanStack: the installed <code>@tanstack/ai</code> <code>chat()</code> requires a <code>threadId</code> the page's sample does not pass.",
      },
      {
        title: "Doc sample imports a name it never uses",
        tone: "info",
        html: "Every Quick Start tab imports <code>createCopilotRuntimeHandler</code> but then calls <code>createCopilotEndpoint</code>, which is not imported. The page on Runtime HTTP endpoints lists it as a deprecated alias. Here the runtime is mounted by <code>server.ts</code>, so neither is called.",
      },
      {
        title: "Model ids are the page's",
        tone: "info",
        html: "<code>openai(\"gpt-6-luna\")</code>, <code>openaiText(\"gpt-6-luna\")</code> and <code>anthropic(\"claude-sonnet-4-6\")</code> are kept as written. The failures above come before the model id is ever checked, because the key lookup runs first.",
      },
    ],
  },
  {
    path: "/backend/agent-runner",
    title: "AgentRunner and persistence",
    docPath: "backend/agent-runner",
    summary:
      "The page's `MyRunner extends InMemoryAgentRunner`, with the page's bounds (`maxThreads` / `maxRunsPerThread` / `maxBytes`) and `onConcurrentRun: \"supersede\"`. A chat pinned to a thread id can be remounted to show that `connect` replays the history. A second runtime uses `SqliteAgentRunner({ dbPath })`.",
    status: "partial",
    statusNote:
      "In-memory works: after a remount, connect replays the thread, /threads/:id/messages returns it, MyRunner logs run/connect, and supersede aborts the first run (\"This operation was aborted\", code abort). SqliteAgentRunner is broken: \"Cannot find package 'better-sqlite3' imported from …/@copilotkit/sqlite-runner/dist/sqlite-runner.mjs\". The peer dependency is not installed.",
    hasDemo: true,
    agentId: "section-f-agent-runner (key: default)",
    runtimePath: "/api/copilotkit-section-f-runner",
    tryIt: {
      prompts: ["Remember the codeword PELICAN-42 and confirm it in one line.", "(click) Remount chat (same threadId)"],
      expect:
        "After the remount, the conversation reappears. The MyRunner panel shows a new `connect` for the same thread, and \"GET /threads/:id/messages\" returns 200 with both messages. Switching to SqliteAgentRunner shows HTTP 503 with the better-sqlite3 error.",
      fail: "An empty chat after the remount: the runner did not replay the thread.",
    },
    sources: P(
      "/backend/agent-runner",
      "frontend/runtime/endpoints/section-f-runner.ts",
      "frontend/runtime/endpoints/section-f-sqlite.ts",
    ),
    notes: [
      {
        title: "SqliteAgentRunner: peer dependency missing",
        tone: "warn",
        html: "<code>@copilotkit/sqlite-runner@1.87.0</code> is installed, but its peer <code>better-sqlite3</code> is not, and the package imports it statically. Importing the runner therefore fails at module load. The endpoint imports it dynamically and answers 503 with the real error (NOT DOC CODE wrapper), so the rest of the runtime still starts. Fix: <code>npm install better-sqlite3</code>, plus its native build, which the install policy may block.",
      },
      {
        title: "Limits are process-global",
        tone: "info",
        html: "As the page warns, the bounds passed here reconfigure every in-memory thread in this Node process, including the other endpoints'. The runtime logged nothing about it, which matches the page: the first explicit override is silent.",
      },
      {
        title: "Call log (NOT DOC CODE)",
        tone: "info",
        html: "Where the page writes <code>// persist request.threadId / input here</code>, MyRunner appends to an in-process log. The endpoint exposes it at <code>GET /api/copilotkit-section-f-runner/__runner-log</code> so the demo can show each run/connect call.",
      },
    ],
  },
  {
    path: "/backend/ag-ui",
    title: "Connect AG-UI agents",
    docPath: "backend/ag-ui",
    summary:
      "The page's `useAgent` + `agent.subscribe({...})` ported to Vue, with every callback from its table attached. Next to it are the page's `AgentStatus` fields (`messages`, `state`, `isRunning`) and a raw AG-UI event panel, all on a runtime-proxied Claude agent that has one backend tool.",
    status: "working",
    statusNote:
      "Verified in the browser. One dice-roll run fired onRunStarted, onStateSnapshot, onCustomEvent, onToolCallStart/Args/End/Result (mcp__dice__roll_dice), onTextMessage*, onMessagesSnapshot, onMessagesChanged, onStateChanged and onRunFinished. The raw panel showed the same stream, including REASONING_* events.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "section-f-ag-ui",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Roll 3 dice please"],
      expect:
        "The middle column fills with callback names, including `onToolCallEndEvent Tool called: mcp__dice__roll_dice {\"count\":3}` and `onToolCallResultEvent {\"faces\": [4, 2, 6], \"total\": 12}`. AgentStatus ends at `isRunning false`. The chat answers with faces 4, 2, 6 and a total of 12.",
      fail: "An empty callback log while the chat answers means the subscription is attached to a different agent instance.",
    },
    sources: P("/backend/ag-ui", "frontend/src/pages/backend/ag-ui/EventLog.vue", RAW, PY),
    notes: [
      {
        title: "Vue page has no code",
        tone: "info",
        html: "The Vue variant of this page publishes the event table and the prose, with empty code slots. The React variant shows <code>useAgent({ agentId })</code> plus <code>agent.subscribe</code> inside <code>useEffect</code>, cleaning up with <code>subscription.unsubscribe()</code>. In Vue that becomes a <code>watch</code> on the agent ref with <code>onCleanup</code>.",
      },
      {
        title: "Backend tool (NOT DOC CODE)",
        tone: "info",
        html: "The tool-call callbacks only fire if the agent calls a tool. The agent therefore has one deterministic in-process MCP tool, <code>roll_dice</code> (faces cycle 4, 2, 6, 1, 5, 3).",
      },
    ],
  },
  {
    path: "/auth",
    title: "Authentication",
    docPath: "auth",
    summary:
      "The page's frontend `headers` + `useSingleEndpoint={false}`, ported to `CopilotKitProvider`. The runtime has the page's `onRequest` Bearer gate (401) and its `onBeforeHandler` thread-ownership check (403). Two demo users share one thread id, so Bob can be shown to be shut out of Alice's thread. A header-echo agent shows that the Authorization header reaches the agent server.",
    status: "working",
    statusNote:
      "Verified in the browser. No token: 401 {\"error\":\"unauthorized\"}. Invalid token: 401 {\"error\":\"invalid token\"}. Alice: the chat runs and the echo shows authorization: Bearer alice-token at the agent. Bob on Alice's thread: connect/run/messages all 403 Forbidden.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "section-f-auth (key: default) + header-echo",
    runtimePath: "/api/copilotkit-section-f-auth",
    tryIt: {
      prompts: [
        "(as Alice) Reply with exactly: authorized",
        "(as Alice, agent header-echo) who am I?",
        "(click Bob, then GET /threads/:id/messages)",
      ],
      expect:
        "Alice gets a reply, and header-echo shows `\"authorization\": \"Bearer alice-token\"`. As Bob the same thread is empty and \"Agent run failed\" appears. The direct call shows HTTP 403 Forbidden. Invalid token and No token give HTTP 401 on GET /info.",
      fail: "Bob reading Alice's messages (200) means onBeforeHandler is not running.",
    },
    sources: P("/auth", "frontend/runtime/endpoints/section-f-auth.ts", RAW, PY),
    notes: [
      {
        title: "Frontend sample is React",
        tone: "info",
        html: "The page shows <code>&lt;CopilotKit headers={{ Authorization }} useSingleEndpoint={false}&gt;</code>. The Vue provider takes the same props: <code>:headers</code> and <code>:use-single-endpoint=\"false\"</code>.",
      },
      {
        title: "Stand-ins for \"your validation\" (NOT DOC CODE)",
        tone: "warn",
        html: "The hooks are the page's. It leaves <code>verifyJwt</code>, <code>verifyRequest</code> and <code>userOwnsThread</code> to you. They are filled in with two fixed tokens (<code>alice-token</code>, <code>bob-token</code>). An invalid one throws a 401 <code>Response</code>, as a real verifier would, so the page's <code>onRequest</code> body stays verbatim. Thread ownership is a Map that records the first user to touch a thread, in place of the page's <code>thread_owners</code> table.",
      },
      {
        title: "Hooks via createCopilotNodeListener",
        tone: "info",
        html: "The page passes <code>hooks</code> to <code>createCopilotRuntimeHandler</code>. Here they reach <code>createCopilotNodeListener</code> through the endpoint's <code>options</code>. It accepts the same <code>CopilotRuntimeHandlerOptions.hooks</code>.",
      },
    ],
  },
];
