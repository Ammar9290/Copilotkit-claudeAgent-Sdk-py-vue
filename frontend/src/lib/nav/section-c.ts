/** Worker C — Generative UI › Declarative › A2UI, JSON Render, Hashbrown.
 *
 * Each entry is one doc route. Edit only this file for this section. */
import { P, type RouteMeta } from "./types";

const DUP_WARNING =
  "The console logs <code>CopilotChatMessageView: Deduplicated N message(s) with duplicate IDs.</code> warnings while the A2UI follow-up run streams. They come from <code>@copilotkit/vue</code> and do not affect what renders.";

const FOLLOW_UP_NOTE =
  "After the render tool returns, the agent gets a second turn. Its reply often reads like it was asked to carry on (\"Could you clarify what you'd like to continue with?\") even though the user sent nothing new. The surface itself is unaffected.";

export const declarativeOther: RouteMeta[] = [
  {
    path: "/generative-ui/a2ui",
    title: "A2UI",
    docPath: "generative-ui/a2ui",
    summary:
      "The overview's second setup path: the provider gets no catalog, and the runtime turns A2UI on with `a2ui: { injectA2UITool: true }`. The agent calls the injected render tool and the surface renders in the chat, colored by the page's `--a2ui-*` CSS variables.",
    status: "working",
    statusNote:
      "Verified: with only the runtime `a2ui` block, a contact-form surface renders, and the `.a2ui-surface` color variables (purple) apply.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "a2ui",
    runtimePath: "/api/copilotkit-section-c-a2ui",
    tryIt: {
      prompts: ["Build a contact form with name, email and a submit button."],
      expect:
        "\"Generating UI…\" appears, then a purple-tinted card with text fields and a purple Submit button renders in the chat, followed by a one-line reply.",
      fail: "The tool call shows as plain text or JSON, or nothing renders: A2UI is not enabled on this runtime.",
    },
    sources: P(
      "/generative-ui/a2ui",
      "frontend/runtime/endpoints/section-c-a2ui.ts",
      "backend/src/agents/routes/section_c.py",
      "backend/src/agents/section_c/prompts.py",
    ),
    notes: [
      {
        title: "Which setup path this demo uses",
        tone: "info",
        html: "The page lists two ways to turn A2UI on. The recommended one (a catalog on the provider) is what the <a href=\"/generative-ui/a2ui/dynamic-schema\">Dynamic Schema</a> demo uses. This demo uses the other one, \"Enable on the runtime without a catalog\": the runtime snippet is used as published (<code>a2ui: { injectA2UITool: true }</code> plus <code>InMemoryAgentRunner</code>), and <code>&lt;CopilotKitProvider&gt;</code> gets no <code>a2ui</code> prop. The Vue renderer still draws the surface with its built-in basic catalog.",
      },
      {
        title: "React-only provider sample",
        tone: "warn",
        html: "The page's provider sample is React (<code>&lt;CopilotKit a2ui={{ catalog: myCatalog }}&gt;</code>). The Vue counterpart is <code>&lt;CopilotKitProvider :a2ui=\"{ catalog }\"&gt;</code>, and the only catalog <code>@copilotkit/vue</code> 1.87.0 exports is <code>vueBasicCatalog</code>.",
      },
      {
        title: "Injected tool is named render_a2ui, not generate_a2ui",
        tone: "warn",
        html: "The page says the runtime adds a tool named <code>generate_a2ui</code> that runs a secondary LLM. In the AG-UI stream the injected tool is <code>render_a2ui</code> (\"Render a dynamic A2UI v0.9 surface with structured parameters\"). The agent itself fills in the surface arguments, and the tool result is <code>{\"status\":\"rendered\"}</code>.",
      },
      {
        title: "Python helpers on the page do not apply here",
        tone: "info",
        html: "<code>from copilotkit import a2ui</code> (<code>create_surface</code>, <code>update_components</code>, <code>render</code>) belongs to the <code>copilotkit</code> Python package, which this Claude Agent SDK backend does not install. The opt-out factory <code>get_a2ui_tools()</code> is shown importing from <code>ag_ui_langgraph</code>; <code>ag_ui_claude_sdk</code> has no A2UI helpers. The Fixed Schema demo builds the operations container by hand, as that page does.",
      },
      {
        title: "Agent prompt (repo-authored)",
        tone: "info",
        html: "In the first runs, the agent kept calling the render tool to \"enhance\" the form until it reached <code>max_turns</code> (five or more surfaces from one message). The page publishes no agent prompt, so this repo's prompt now says to call the tool once per user message.",
      },
      { title: "Expected console warnings", tone: "info", html: DUP_WARNING },
    ],
  },
  {
    path: "/generative-ui/a2ui/fixed-schema",
    title: "Fixed Schema A2UI",
    docPath: "generative-ui/a2ui/fixed-schema",
    summary:
      "The backend `display_flight` tool returns the page's `a2ui_operations` container (createSurface + updateComponents with a pre-authored flight schema + updateDataModel). The runtime runs A2UI with `injectA2UITool: false`. The page's custom flight catalog is React-only, so the Vue renderer has no catalog with that id.",
    status: "broken",
    statusNote:
      "The tool runs and the middleware forwards the surface, but the chat shows “A2UI render error: Catalog not found: copilotkit://flight-fixed-catalog”. The page builds that catalog with React's createCatalog; @copilotkit/vue 1.87.0 has no equivalent.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "a2ui-fixed-schema",
    runtimePath: "/api/copilotkit-section-c-a2ui-fixed",
    tryIt: {
      prompts: ["Show me a United flight from SFO to JFK for $289."],
      expect:
        "What the page promises: a flight card with both airport codes, an arrow, an airline badge, the price and a Book button. What happens here: the red line “A2UI render error: Catalog not found: copilotkit://flight-fixed-catalog” in place of the card.",
      fail: "No error line and no card: the agent did not call display_flight.",
    },
    sources: P(
      "/generative-ui/a2ui/fixed-schema",
      "frontend/runtime/endpoints/section-c-a2ui-fixed.ts",
      "backend/src/agents/section_c/a2ui_fixed.py",
      "backend/src/agents/section_c/a2ui_schemas/flight_schema.json",
      "backend/src/agents/section_c/flights_mcp.py",
      "backend/src/agents/routes/section_c.py",
    ),
    notes: [
      {
        title: "Why the card does not render",
        tone: "warn",
        html: "The schema's <code>createSurface</code> names <code>catalogId: \"copilotkit://flight-fixed-catalog\"</code>. On the page, that catalog comes from <code>createCatalog(definitions, renderers, { catalogId, includeBasicCatalog: true })</code> in <code>@copilotkit/a2ui-renderer</code>, a React package with React renderers. <code>@copilotkit/vue</code> 1.87.0 has no <code>createCatalog</code>. Its type definitions declare <code>createVueComponent</code>, but the package entry does not export it at runtime; only <code>vueBasicCatalog</code> is exported. So the demo passes <code>vueBasicCatalog</code>, and the Vue message processor throws <code>A2uiCatalogError: Catalog not found: copilotkit://flight-fixed-catalog</code> (logged as a <code>[A2UI Vue] processMessages error</code> console warning). No catalog was hand-built from <code>@a2ui/web_core</code> internals to get around this.",
      },
      {
        title: "What does work",
        tone: "success",
        html: "The agent calls <code>display_flight</code> with origin, destination, airline and price. The tool's result is the page's v0.9 operations container. The runtime's A2UI middleware (<code>injectA2UITool: false, agents: [\"a2ui-fixed-schema\"]</code>) picks it out of the tool result and hands it to the chat as an A2UI surface. The only step that fails is the Vue renderer looking up the catalog.",
      },
      {
        title: "NOT DOC CODE: tool bridge, IDs and schema file",
        tone: "info",
        html: "The page never shows how to register a Python tool on <code>ClaudeAgentAdapter</code>. <code>flights_mcp.py</code> wraps the published <code>DISPLAY_FLIGHT_TOOL</code> and <code>_display_flight_operations</code> in an in-process MCP server (<code>create_sdk_mcp_server</code>) and grants it as <code>mcp__flights__display_flight</code>. <code>SURFACE_ID</code> and <code>CATALOG_ID</code> are used but never defined on the page; <code>CATALOG_ID</code> is copied from the page's <code>catalog.ts</code>. The page loads <code>flight_schema.json</code> but never publishes its contents; the repo's file follows the tree the page draws.",
      },
      {
        title: "Book button",
        tone: "info",
        html: "The page says the Python SDK cannot attach <code>action_handlers</code> yet, so the Book action has no handler on the backend. Here the button never renders at all, because the whole surface fails.",
      },
    ],
  },
  {
    path: "/generative-ui/a2ui/dynamic-schema",
    title: "Dynamic Schema A2UI",
    docPath: "generative-ui/a2ui/dynamic-schema",
    summary:
      "The page's default path: a catalog on the provider auto-enables A2UI and injects the render tool, on a runtime with no `a2ui` block. The agent designs the surface on the fly. The page's custom dashboard catalog is React-only, so the Vue demo passes `vueBasicCatalog`.",
    status: "partial",
    statusNote:
      "Auto-enable and injection work: LLM-designed surfaces (forms, sliders, buttons) render through vueBasicCatalog. The page's custom catalog (Card/StatusBadge/Metric/InfoRow/DataTable/PrimaryButton/PieChart/BarChart) cannot be built in Vue: there is no createCatalog in @copilotkit/vue 1.87.0.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "a2ui-dynamic-schema",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: [
        "Build a contact form with name, email and a submit button.",
        "Show a project status card with a title, a progress slider at 60% and an Approve button.",
      ],
      expect:
        "\"Generating UI…\" appears, then a card with text fields, a slider or buttons renders in the chat, followed by a one-line reply.",
      fail: "Text only: the provider's catalog did not turn A2UI on, so no render tool was injected.",
    },
    sources: P("/generative-ui/a2ui/dynamic-schema", "frontend/runtime/endpoints/default.ts", "backend/src/agents/section_c/prompts.py"),
    notes: [
      {
        title: "What is the doc's and what is not",
        tone: "info",
        html: "As the page shows: one prop on the provider (<code>:a2ui=\"{ catalog }\"</code>) and nothing on the runtime. This demo uses the shared <code>/api/copilotkit</code> runtime, which has no <code>a2ui</code> option. The provider sends <code>a2uiCatalogAvailable</code>, and the runtime then applies <code>A2UIMiddleware</code> with tool injection on. The catalog is <code>vueBasicCatalog</code>, the only one <code>@copilotkit/vue</code> exports. The page's three-file split (<code>definitions.ts</code> / <code>renderers.tsx</code> / <code>catalog.ts</code>) uses <code>@copilotkit/a2ui-renderer</code> and React renderers (Recharts, shadcn), and has no Vue counterpart.",
      },
      {
        title: "Tool name and opt-out factory",
        tone: "warn",
        html: "The page calls the injected tool <code>generate_a2ui</code> and describes a secondary LLM. In this stack it is <code>render_a2ui</code>, filled in by the agent itself. The opt-out section's <code>get_a2ui_tools()</code> imports from <code>ag_ui_langgraph</code> and uses a LangChain OpenAI model; <code>ag_ui_claude_sdk</code> has no such factory. The \"Progressive streaming\" section also describes LangGraph events, but the A2UI activity snapshots do stream here as the tool arguments arrive.",
      },
      { title: "Follow-up reply", tone: "info", html: FOLLOW_UP_NOTE },
      { title: "Expected console warnings", tone: "info", html: DUP_WARNING },
    ],
  },
  {
    path: "/generative-ui/json-render",
    title: "JSON Render",
    docPath: "generative-ui/json-render",
    summary:
      "The agent replies with a `{ root, elements }` json-render spec (MetricCard / BarChart / PieChart). The page renders it with `@json-render/react`, which is not installed here, so the spec shows as the plain assistant message.",
    status: "partial",
    statusNote:
      "Backend half verified: the agent replies with a valid { root, elements } spec. Nothing renders it: the page's frontend is @json-render/react, and @json-render/vue (published on npm, 0.22.0) is not installed.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "json-render",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show me the sales dashboard with metrics and a revenue chart"],
      expect:
        "The reply is one JSON object starting with {\"root\": and an \"elements\" map of MetricCard / BarChart / PieChart entries. It stays as text: no cards or charts render.",
      fail: "Prose or a markdown table instead of JSON: the agent ignored the output contract.",
    },
    sources: P("/generative-ui/json-render", "backend/src/agents/section_c/prompts.py", "backend/src/agents/routes/section_c.py"),
    notes: [
      {
        title: "Missing frontend: package not installed",
        tone: "warn",
        html: "The page's frontend is <code>JsonRenderAssistantMessage</code> in <code>&lt;CopilotChat messageView={{ assistantMessage }}&gt;</code>, rendering through <code>JSONUIProvider</code> + <code>Renderer</code> from <code>@json-render/react</code>, with <code>defineCatalog</code> / <code>defineRegistry</code> from <code>@json-render/core</code> (Zod 4 via a <code>zod4</code> alias). None of these packages is installed. A Vue renderer exists on npm (<code>@json-render/vue</code>), but the page never shows it, and this repo cannot add packages. No renderer was improvised, so the stock Vue chat shows the spec as text.",
      },
      {
        title: "Agent prompt (repo-authored)",
        tone: "info",
        html: "The page gives the output contract and an example but no prompt. The prompt in <code>section_c/prompts.py</code> describes that contract and the three components in this repo's own words. The page's agent id is <code>byoc_json_render</code>; here it is <code>json-render</code>, taken from the route.",
      },
    ],
  },
  {
    path: "/generative-ui/hashbrown",
    title: "Hashbrown",
    docPath: "generative-ui/hashbrown",
    summary:
      "The agent streams a Hashbrown `{ \"ui\": [...] }` envelope (metric / pieChart / barChart / dealCard / Markdown). The page renders it with `@hashbrownai/react`. Hashbrown has no Vue package, so the envelope shows as the plain assistant message.",
    status: "partial",
    statusNote:
      "Backend half verified: the agent streams a valid { \"ui\": [...] } envelope. The frontend (useUiKit / exposeComponent / useJsonParser) is @hashbrownai/react only; @hashbrownai/vue does not exist on npm.",
    reactOnlyDoc: true,
    hasDemo: true,
    agentId: "hashbrown",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show me a Q4 sales dashboard"],
      expect:
        "The reply is one JSON object starting with {\"ui\":[ and listing metric, barChart, pieChart, dealCard and Markdown nodes. It stays as text: no dashboard renders.",
      fail: "Prose instead of JSON: the agent ignored the envelope contract.",
    },
    sources: P("/generative-ui/hashbrown", "backend/src/agents/section_c/prompts.py", "backend/src/agents/routes/section_c.py"),
    notes: [
      {
        title: "No Vue renderer exists",
        tone: "warn",
        html: "Every frontend file on the page is React: <code>HashBrownDashboard</code> (a React context around <code>useUiKit</code>), <code>exposeComponent</code> / <code>exposeMarkdown</code>, and <code>useJsonParser(content, kit.schema)</code> in the <code>assistantMessage</code> slot. Hashbrown publishes <code>@hashbrownai/core</code> and <code>@hashbrownai/react</code>, but not <code>@hashbrownai/vue</code> (npm returns 404). None of these is installed, and no Vue port was written.",
      },
      {
        title: "Agent prompt (repo-authored)",
        tone: "info",
        html: "The page's Backend section gives the envelope and an example but no prompt. <code>section_c/prompts.py</code> states that contract in this repo's own words. The page's agent id is <code>declarative-hashbrown-demo</code> on <code>/api/copilotkit-declarative-hashbrown</code>; here it is <code>hashbrown</code> on the shared runtime, because the page shows no runtime config to reproduce.",
      },
    ],
  },
];
