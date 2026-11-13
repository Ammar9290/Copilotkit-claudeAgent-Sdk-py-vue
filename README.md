# CopilotKit + Claude Agent SDK (Python) · Vue Test Suite

A clickable test harness for CopilotKit's **Vue** frontend (`@copilotkit/vue/v2`) on a **Claude Agent SDK (Python)** backend. Every in-scope page of [docs.copilotkit.ai/vue/claude-sdk-python](https://docs.copilotkit.ai/vue/claude-sdk-python) is a route with a working implementation, or with a status that says honestly why it doesn't work.

**Doc sync:** 2026-11-12, plus State Rendering and State Streaming on 2026-11-13 (50 pages, see `doc-snapshot/`) · **Packages:** `@copilotkit/vue` 1.87.0 · `@copilotkit/runtime` 1.87.0 · `@ag-ui/client` 1.0.2 · `ag-ui-claude-sdk` 0.2.4 · `claude-agent-sdk` 0.2.170 · **Status:** 22 ✅ · 14 ⚠️ · 7 ❌ · 7 🚫 · no CI

---

## 1. Overview

The Vue docs for this integration cover chat UI, threads, generative UI, shared state, human-in-the-loop, the Copilot Runtime and more. This repo turns each page into two routes:

- a **notes route** (`/<path>`) with what the page teaches, what to try, how to tell pass from fail, any discrepancies, and the exact source behind the demo;
- a **demo route** (`/<path>/demo-chat`) with the live feature full-bleed, for testing by hand or with the autorecorder.

Pages that are broken with the current packages or this backend are **left broken and marked so**. They were not patched to look like they work. The status badge is in the sidebar, the route header and `/status`.

Tracked doc root: <https://docs.copilotkit.ai/vue/claude-sdk-python>

## 2. Architecture

Three processes. The Vue Quickstart's shape is a Vite app plus a standalone Node Copilot Runtime with `cors: true`. Here that runtime forwards to a Python agent server instead of the Quickstart's `BuiltInAgent`.

```
Browser — Vite + Vue 3 (:5273)
  │  @copilotkit/vue/v2: CopilotKitProvider, CopilotChat, composables
  │  runtime-url="/api/copilotkit…"   (Vite proxies /api → :8300)
  ▼
Copilot Runtime — Node, frontend/server.ts (:8300)
  │  one createCopilotNodeListener per file in frontend/runtime/endpoints/
  │  agents bound with HttpAgent({ url: http://localhost:8100/<agentId> })
  ▼
Claude Agent SDK (Python) — FastAPI, backend/src/agent_server.py (:8100)
  │  one ClaudeAgentAdapter per route, POST /<agentId>, AG-UI over SSE
  ▼
Claude Code CLI (bundled with claude-agent-sdk) → Anthropic API (claude-sonnet-4-6)
```

- **Backend language:** Python 3.13, FastAPI, `ag_ui_claude_sdk.ClaudeAgentAdapter`.
- **The default runtime endpoint** (`/api/copilotkit`) asks the backend's `/health` which agents exist and registers them all, so adding an agent means adding one Python module.
- **Pages about runtime configuration** (A2UI, MCP Apps, Open Generative UI, auth, runners, BuiltInAgent, model routers, threads) get their own base path, so their middleware never leaks into other routes.
- **Ports** are deliberately not the Quickstart's 5173/8200, so this harness can run beside the sibling harnesses. Every port can be overridden (§5).

## 3. Prerequisites

| Tool | Version used |
|---|---|
| Node.js | 24.19 (20+ works) |
| npm | 11 |
| Python | 3.13 |
| [uv](https://docs.astral.sh/uv/) | 0.12 |
| Chromium for the autorecorder | installed by `npx playwright install chromium` |

Model access, one of:

- **A Claude Code login on this machine.** The Claude Agent SDK runs a bundled Claude Code CLI, and with no key it uses your logged-in account. This is how the harness was verified.
- **An `ANTHROPIC_API_KEY` with credit** in `backend/.env`. If set, it takes priority, so a key with no credit makes every run fail with `Credit balance is too low`.

Optional keys, each needed only by the pages that say so:

- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` **in the runtime's environment**: Built-in Agent and Use any model router call models directly from Node.
- `CPK_INTELLIGENCE_API_KEY` + `COPILOTKIT_LICENSE_TOKEN`: the premium Threads pages.

## 4. Setup

```bash
git clone <this repo> cpk-Vue-claudeAgent-SDK-py
cd cpk-Vue-claudeAgent-SDK-py

# frontend + runtime
cd frontend && npm install && cd ..

# backend
cd backend && uv sync && cd ..

# env (both optional for a machine with a Claude Code login)
cp .env.example backend/.env      # keep only the backend block
cp .env.example frontend/.env     # keep only the frontend blocks
```

| Variable | File | What it does | Default |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | backend/.env | API key for the Claude Agent SDK. Unset means the Claude Code CLI login is used. | unset |
| `ANTHROPIC_MODEL` | backend/.env | Model every Python agent runs on | `claude-sonnet-4-6` |
| `AGENT_PORT` | backend/.env | Agent server port | `8100` |
| `PORT` | frontend/.env | Copilot Runtime port | `8300` |
| `AGENT_URL` | frontend/.env | Where the runtime sends agent runs | `http://localhost:8100` |
| `OPENAI_API_KEY` | frontend/.env | Built-in Agent / model-router pages only | unset |
| `CPK_INTELLIGENCE_API_KEY`, `COPILOTKIT_LICENSE_TOKEN` | frontend/.env | Premium threads | unset |
| `VITE_PORT`, `VITE_RUNTIME_ORIGIN`, `VITE_AGENT_ORIGIN` | frontend/.env | Vite port, and where Vite proxies `/api` and `/agent` | `5273`, `:8300`, `:8100` |
| `VITE_COPILOTKIT_INSPECTOR` | frontend/.env | `off` hides the Inspector app-wide | on |

Default ports: **Vite 5273 · Runtime 8300 · Agent 8100.**

## 5. Running the project

Two terminals:

```bash
# 1 — agent server (no --reload; see §10)
cd backend
uv run python src/agent_server.py
```

You should see `Mounted 38 agents: a2ui, a2ui-dynamic-schema, …` followed by `Uvicorn running on http://localhost:8100`.

```bash
# 2 — Copilot Runtime + Vite together
cd frontend
npm run dev
```

You should see `[runtime] Copilot Runtime listening at http://localhost:8300`, a list of 15 base paths, and `[vite] ➜ Local: http://localhost:5273/`.

Open **<http://localhost:5273>**. The Introduction page's *Connection check* should show green dots for Vite, the runtime and the agent server (38 agents). Grey dots are optional keys.

Smoke tests without a browser:

```bash
curl localhost:8100/health                 # {"status":"ok","count":38,...}
curl localhost:8300/harness/health         # runtime base paths + agent list
curl localhost:5273/api/copilotkit/info    # through the Vite proxy
```

## 6. What to expect: walkthrough per section

Each demo is at `<route>/demo-chat`. Each notes route repeats its prompt, pass/fail criteria and source.

### Getting Started
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/` | Orientation and a live connection check | Open it | Pass: three green dots and 38 agents listed. Fail: a red row names the process that is down. |
| `/quickstart` | The Quickstart's `App.vue` verbatim: `CopilotKitProvider` with an absolute cross-origin runtime URL, and `<CopilotChat />` with no agent id (uses `default`) | "Tell me in one sentence what this app can do." | Pass: tokens stream and the reply renders as markdown. Fail: no reply or a red error. |

### Basics
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/prebuilt-components` | `CopilotChat`, `CopilotSidebar`, `CopilotPopup` in tabs; suggestions, chat events, 👍/👎, a custom launcher | "Write me a haiku about Vue." then 👍, then each tab's launcher | Pass: all three stream; the event log shows `feedback {…"up"}`. Fail: a tab is empty or unstyled. |

### Custom Look and Feel
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/custom-look-and-feel/slots` | Named/scoped slots: welcome screen, assistant toolbar items, copy button, user message, labels | Click "Show my open tickets" | Pass: the reply has a "Reviewed" badge and a custom user bubble. Known gap: the page's disclaimer slot renders nothing (⚠️). |
| `/custom-look-and-feel/headless-ui` | Your own UI over `useAgent` / `CopilotChatMessageView` | "Give me a two-item markdown list of fruits." in the custom composer | Pass: plain text on the left and rendered markdown bullets on the right. |
| `/programmatic-control` | `addMessage` + `runAgent`, `stopAgent`, `agent.subscribe` | Click **Run agent**, then try **Stop** | Pass: the log shows started → done and a sales summary appears. |
| `/inspector` | The CopilotKit Inspector overlay | Open the inspector, then AG-UI Events, then send "Say hi in three words." | Pass: RUN_FINISHED appears in the events. Premium tabs stay locked (⚠️). |

### Threads
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/prebuilt-components/copilot-threads-drawer` | `CopilotThreadsDrawer` | Open it | ❌ without Intelligence: "Loading threads…" stays forever, and the chat logs a 503 with the runtime's "apiKey is required" message. |
| `/headless-threads` | `useThreads` with your own list | Send a message | ❌ without Intelligence: the list stays on "Loading…". |
| `/threads-lifecycle` | Thread ids, new chat, reopening, hydration | "My favourite colour is teal. Reply with OK." → **New chat** → **Open conversation** | Pass: the thread id returns to the first one and "teal" is replayed. The Intelligence runtime half is premium (⚠️). |

### Generative UI · Declarative
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/generative-ui/components` | `render_ui` with the standard catalog in chat | "Compare the Starter, Team, and Enterprise plans in a table" | Pass: a real table. Follow-up edits are unreliable (⚠️, §8). |
| `…/components/surfaces` | Rendering into a page target and handing it back | "Show me cheap running shoes in the featured row" → "Show the featured products again" | Pass: product cards replace the page row, then the row returns. |
| `…/components/catalogs` | A custom `acme/shop@1` catalog of your own Vue components | "Show me the products of the shop" | Pass: ProductCards in chat plus the exported catalog JSON. |
| `…/components/standard-catalog` | `standardUI.omit(...)` and overriding Card | "Show a card summarizing today's weather in Paris with a short list of tips." | Pass: the card renders through **MyCard**. |
| `…/components/state-and-actions` | Bindings, actions, writable state | "Show me the Mechanical Keyboard as a product card." then **Add to cart** ×2 | Pass: the cart count is 2. Asking for several cards fails (⚠️). |
| `…/components/theming` | The surface theme as a reactive ref (light/dark) | "Show a form to sign up for our newsletter…" then the violet swatch | Pass: the accent changes live from amber to violet. |
| `…/components/transports` | Tool vs markdown transport vs `agentIds` scoping | Pick **tool**, then "Show a slider to pick a number of seats from 1 to 50." | Pass: a slider surface. In other-agent-only mode, plain text. |
| `…/components/markdown-mode` | a2ui fences in the reply instead of a tool | "Give me a plan estimator with a seats slider." | Pass: an inline slider surface and no tool call. |
| `…/components/from-a2ui` | A catalog converted from A2UI | "Show the route from SFO to JFK with the airports and an arrow." | Pass: two Airport components and an Arrow. |
| `/generative-ui/a2ui` | Runtime `a2ui` middleware with tool injection | "Build a contact form with name, email and a submit button." | Pass: a purple-themed form surface. |
| `…/a2ui/fixed-schema` | An agent-owned fixed-schema tool | "Show me a United flight from SFO to JFK for $289." | ❌ "A2UI render error: Catalog not found: copilotkit://flight-fixed-catalog". |
| `…/a2ui/dynamic-schema` | LLM-designed surfaces | Same contact-form prompt | Pass with the basic catalog; the page's custom catalog can't be built in Vue (⚠️). |
| `/generative-ui/json-render` | A JSON Render spec from the agent | "Show me the sales dashboard with metrics and a revenue chart" | ⚠️ A valid `{"root":…}` spec arrives as text. There is no Vue renderer in the docs. |
| `/generative-ui/hashbrown` | A Hashbrown UI envelope from the agent | "Show me a Q4 sales dashboard" | ⚠️ A valid `{"ui":[…]}` arrives as text. There is no Vue package. |

### Generative UI · Open-Ended and Tools
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/generative-ui/mcp-apps` | `mcpApps` middleware with the public Excalidraw MCP App (needs internet) | "Draw a simple flowchart on the whiteboard: Idea → Build → Ship." | Pass: an Excalidraw iframe in the chat. |
| `/generative-ui/open-generative-ui` | Sandboxed agent-written HTML, plus host sandbox functions | "Build me a simple greeting card." | Pass: a card streams into a sandboxed iframe. |
| `/generative-ui/state-rendering` | Rendering the agent's in-progress state as UI | "Draft a one-paragraph product brief for a habit-tracking app." | ❌ The page's raw Messages API backend needs `ANTHROPIC_API_KEY`: RUN_ERROR "Could not resolve authentication method". Even with a key, the page's component reads state keys its backend never writes (§8). |
| `/generative-ui/tool-rendering` | Rendering a backend tool call | "What's the weather in Tokyo?" | ⚠️ The generic card renders labelled `mcp__weather__get_weather`; the page's `WeatherToolCard` never does (§8). |
| `/generative-ui/tool-based` | A component registered as a tool | "Show me the weather in Lisbon." | Pass: a WeatherCard with temperature and condition. |
| `/frontend-tools` | A browser-side tool changing app state | "Show me only sev1 incidents." | Pass: "Current filter" shows sev1 and the list drops from 5 to 2. |

### Shared State, Human in the Loop, Multi-Agent
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/shared-state` | Read/write agent state | Pick a tone, then "Please remember that my favourite colour is teal." | ❌ The page's raw Messages API backend needs `ANTHROPIC_API_KEY` (§8). The tone buttons still work. |
| `/shared-state/rendering-in-app` | The page canvas rendered from agent state | Tick an item, then "Rename the project to 'Spring launch' and add an item 'Write launch blog post'." | Pass: the title, the new item and your tick all show. |
| `/shared-state/streaming` | Streaming a document into shared state as tool arguments arrive | "Write a three-paragraph essay about why lighthouses matter." | ❌ Same missing-key RUN_ERROR; the draft stays "Waiting for a draft…" with 0 updates. |
| `/shared-state/agent-readonly` | `useAgentContext` read-only context | Select **aurora**, then "Which workspace am I in?" | Pass: the reply says aurora. |
| `/human-in-the-loop` | `useHumanInTheLoop` time picker | "Book an intro call about the Q3 roadmap with Alice from Sales." then pick a slot | Pass: "Picked: …", and the agent confirms the slot. |
| `/human-in-the-loop/governed-actions` | Policy-governed approval card | "Send an email to bob@example.com saying the launch moved to Friday." then **Approve** | Pass for require_approval. Auto allow/deny never resumes the run (⚠️). |
| `/multi-agent/subagents` | Supervisor delegating to sub-agents | "Write a short paragraph about why the Wright brothers' first flight mattered." | ❌ Same missing-key RUN_ERROR (§8). The log stays at 0. |

### Built-in Agent and Runtime
| Route | Demonstrates | Try | Pass / Fail |
|---|---|---|---|
| `/built-in-agent` | `BuiltInAgent` on its own runtime | "What time is it in Tokyo?" | ⚠️ `/info` lists BuiltInAgent; the run fails with "Anthropic API key is missing" unless the runtime has a key. |
| `/built-in-agent/*` (7 pages) | — | — | 🚫 These pages 404 under the Vue docs. |
| `/backend/copilot-runtime` | Runtime modes, direct `agents__unsafe_dev_only`, header forwarding | "Reply with exactly: pong" in each mode | Pass: RUN_FINISHED in every mode; denied headers are stripped. |
| `/backend/runtime-endpoints` | Every runtime HTTP route, with the raw AG-UI SSE of a real run | Click each probe button | Pass: `/info` 200, run streams, unknown agent 404. ⚠️ `/threads` returns 403 where the doc says it lists threads. |
| `/backend/custom-agent` | BuiltInAgent factory mode (AI SDK, TanStack, custom) | Default factory: "What's the weather in San Francisco?" | Pass: "72°F" from the custom factory. Other factories need keys (⚠️). |
| `/backend/agent-runner` | In-memory runner subclass, supersede, SQLite runner | "Remember the codeword PELICAN-42…" → **Remount** → **Read store** | Pass: replayed after remount, store 200. SQLite fails on a missing `better-sqlite3` (⚠️). |
| `/backend/ag-ui` | `agent.subscribe` callbacks and a raw event log | "Roll 3 dice please" | Pass: every callback in the doc's table fires, including the tool result. |
| `/auth` | Runtime auth hooks and per-user thread ownership | "Reply with exactly: authorized", then Bob's token → read Alice's thread | Pass: Alice is served; Bob gets 403; no token gets 401. |

## 7. Testing checklist / current status

`/status` in the app renders this same table from `frontend/src/lib/nav/section-*.ts`, which is the single source of truth.

| Doc page | Route | Status | Notes |
|---|---|---|---|
| [Quickstart](https://docs.copilotkit.ai/vue/claude-sdk-python/quickstart) | `/quickstart` | ✅ Working | `default` is the Python adapter instead of BuiltInAgent |
| [Prebuilt Components](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components) | `/prebuilt-components` | ✅ Working | Chat, Sidebar and Popup; feedback; custom launcher |
| [Slots](https://docs.copilotkit.ai/vue/claude-sdk-python/custom-look-and-feel/slots) | `/custom-look-and-feel/slots` | ⚠️ Partial | Disclaimer slot sample renders nothing |
| [Fully Headless UI](https://docs.copilotkit.ai/vue/claude-sdk-python/custom-look-and-feel/headless-ui) | `/custom-look-and-feel/headless-ui` | ✅ Working | |
| [Programmatic Control](https://docs.copilotkit.ai/vue/claude-sdk-python/programmatic-control) | `/programmatic-control` | ✅ Working | |
| [Inspector](https://docs.copilotkit.ai/vue/claude-sdk-python/inspector) | `/inspector` | ⚠️ Partial | Premium tabs locked; doc code is React only |
| [Threads Drawer](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/copilot-threads-drawer) | `/prebuilt-components/copilot-threads-drawer` | ❌ Broken | Requires premium (Intelligence key). Stuck on "Loading threads…" |
| [Headless Threads](https://docs.copilotkit.ai/vue/claude-sdk-python/headless-threads) | `/headless-threads` | ❌ Broken | Requires premium (Intelligence key) |
| [Thread & History Lifecycle](https://docs.copilotkit.ai/vue/claude-sdk-python/threads-lifecycle) | `/threads-lifecycle` | ⚠️ Partial | Client lifecycle works; the Intelligence runtime is premium |
| [Components and surfaces](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components) | `/generative-ui/components` | ⚠️ Partial | First render works; in-place follow-ups unreliable |
| [Surfaces](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/surfaces) | `/generative-ui/components/surfaces` | ✅ Working | |
| [Catalogs](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/catalogs) | `/generative-ui/components/catalogs` | ✅ Working | `exportA2UICatalog` type cast |
| [Standard Catalog](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/standard-catalog) | `/generative-ui/components/standard-catalog` | ✅ Working | |
| [State and actions](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/state-and-actions) | `/generative-ui/components/state-and-actions` | ⚠️ Partial | Multi-card requests fail (no layout component) |
| [Theming](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/theming) | `/generative-ui/components/theming` | ✅ Working | |
| [Transports](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/transports) | `/generative-ui/components/transports` | ✅ Working | |
| [Markdown Mode](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/markdown-mode) | `/generative-ui/components/markdown-mode` | ✅ Working | |
| [Adopt from A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/from-a2ui) | `/generative-ui/components/from-a2ui` | ✅ Working | |
| [A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui) | `/generative-ui/a2ui` | ✅ Working | |
| [Fixed Schema A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/fixed-schema) | `/generative-ui/a2ui/fixed-schema` | ❌ Broken | `Catalog not found`; no `createCatalog` in Vue |
| [Dynamic Schema A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/dynamic-schema) | `/generative-ui/a2ui/dynamic-schema` | ⚠️ Partial | Basic catalog only |
| [JSON Render](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/json-render) | `/generative-ui/json-render` | ⚠️ Partial | Spec arrives; React-only renderer |
| [Hashbrown](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/hashbrown) | `/generative-ui/hashbrown` | ⚠️ Partial | Envelope arrives; no Vue package |
| [MCP Apps](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/mcp-apps) | `/generative-ui/mcp-apps` | ✅ Working | Needs internet (Excalidraw) |
| [Open Generative UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/open-generative-ui) | `/generative-ui/open-generative-ui` | ✅ Working | Doc code is React only, ported |
| [State Rendering](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/state-rendering) | `/generative-ui/state-rendering` | ❌ Broken | Raw Messages API backend needs `ANTHROPIC_API_KEY`; frontend/backend state keys don't match |
| [Tool Rendering](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/tool-rendering) | `/generative-ui/tool-rendering` | ⚠️ Partial | `mcp__weather__` prefix not stripped |
| [Component as tool](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/tool-based) | `/generative-ui/tool-based` | ✅ Working | |
| [Frontend Tools](https://docs.copilotkit.ai/vue/claude-sdk-python/frontend-tools) | `/frontend-tools` | ✅ Working | |
| [Shared State](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state) | `/shared-state` | ❌ Broken | Raw Messages API backend needs `ANTHROPIC_API_KEY` |
| [Render agent state in your app](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/rendering-in-app) | `/shared-state/rendering-in-app` | ✅ Working | |
| [State Streaming](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/streaming) | `/shared-state/streaming` | ❌ Broken | Raw Messages API backend needs `ANTHROPIC_API_KEY` |
| [Agent Read-Only Context](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/agent-readonly) | `/shared-state/agent-readonly` | ✅ Working | Agent still gets a state tool (§8) |
| [HITL Overview](https://docs.copilotkit.ai/vue/claude-sdk-python/human-in-the-loop) | `/human-in-the-loop` | ✅ Working | |
| [Governed Action Approval UI](https://docs.copilotkit.ai/vue/claude-sdk-python/human-in-the-loop/governed-actions) | `/human-in-the-loop/governed-actions` | ⚠️ Partial | allow/deny auto-respond never resumes |
| [Built-in Agent](https://docs.copilotkit.ai/vue/claude-sdk-python/built-in-agent) | `/built-in-agent` | ⚠️ Partial | Needs a model key in the runtime env |
| Server Tools · MCP servers · Advanced Configuration · Model Selection · OpenAI · Anthropic · Google | `/built-in-agent/*` | 🚫 Not available for Vue | 404 under `/vue/claude-sdk-python` (both URL forms checked) |
| [Copilot Runtime](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/copilot-runtime) | `/backend/copilot-runtime` | ✅ Working | |
| [Runtime HTTP endpoints](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/runtime-endpoints) | `/backend/runtime-endpoints` | ⚠️ Partial | `/threads` 403 vs doc |
| [Use any model router](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/custom-agent) | `/backend/custom-agent` | ⚠️ Partial | Only the keyless custom factory runs |
| [AgentRunner and persistence](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/agent-runner) | `/backend/agent-runner` | ⚠️ Partial | SQLite runner: `better-sqlite3` missing |
| [Connect AG-UI agents](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/ag-ui) | `/backend/ag-ui` | ✅ Working | Vue page has no code; React ported |
| [Authentication](https://docs.copilotkit.ai/vue/claude-sdk-python/auth) | `/auth` | ✅ Working | Frontend sample is React, ported |
| [Sub-Agents](https://docs.copilotkit.ai/vue/claude-sdk-python/multi-agent/subagents) | `/multi-agent/subagents` | ❌ Broken | Raw Messages API backend needs `ANTHROPIC_API_KEY` |

## 8. Known issues and doc-vs-implementation discrepancies

**Integration (adapter / packages)**

1. **Backend tool names keep their MCP prefix.** `ag_ui_claude_sdk` 0.2.4's `strip_mcp_prefix` only removes `mcp__ag_ui__`, so a Python backend tool arrives as `mcp__weather__get_weather`, and the doc's `useRenderTool({ name: "get_weather" })` never matches. [Tool Rendering](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/tool-rendering)
2. **Frontend-tool round trips replay on the next turn.** `ClaudeAgentAdapter` ends the run at each frontend tool call (`render_ui`, `render_a2ui`, frontend tools). The next turn carries the tool result, and its reply often opens with off-topic text ("There's no prior task to continue…"). Two such calls in one turn end in `RUN_ERROR: Claude SDK cannot resume multiple pending tool calls`. The Vue chat also logs `Deduplicated N message(s) with duplicate IDs`. [Components and surfaces](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components)
3. **`@copilotkit/vue` 1.87.0 has no `createCatalog`.** Its types declare `createVueComponent`, but it isn't exported, so the custom catalogs on [Fixed Schema](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/fixed-schema) and [Dynamic Schema](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/dynamic-schema) can't be built. Only `vueBasicCatalog` exists.
4. **The A2UI tool doesn't match the docs.** The pages describe `generate_a2ui` designed by a secondary LLM. The actual stream has `render_a2ui`, with arguments filled by the main agent and the result `{"status":"rendered"}`. Without "call it once per user message" in the prompt, the agent loops on it until `max_turns`. [A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui)
5. **Governed allow/deny never resumes.** The doc card's `watchEffect` auto-`respond` fires before the HITL handler has stored its resolver, so "Decision sent." appears but no tool result is sent. The `useInterrupt` path can't fire with this adapter (it interrupts only for `defer_tools`, with different metadata). [Governed Actions](https://docs.copilotkit.ai/vue/claude-sdk-python/human-in-the-loop/governed-actions)
6. **The read-only context isn't read-only for the agent.** CopilotKit always sends `state: {}`, so the adapter always adds its `ag_ui_update_state` tool, and the agent will claim it switched the value. [Agent Read-Only Context](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/agent-readonly)
7. **`/threads` and `/threads/clear` return 403 `thread_access_not_configured`** unless `identifyUser` or `threads: { access: "open" }` is set. The docs say they list every thread and answer 204. [Runtime HTTP endpoints](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/runtime-endpoints), [AgentRunner](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/agent-runner)
8. **`@copilotkit/sqlite-runner` imports `better-sqlite3` statically.** If the peer dependency is missing, it crashes on import instead of showing its friendly error. [AgentRunner](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/agent-runner)
9. **The Intelligence threads runtime throws at construction without a key**, and the drawer then shows "Loading threads…" indefinitely instead of the locked view the page describes. [Threads Drawer](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/copilot-threads-drawer)
10. **The slots disclaimer sample renders nothing.** `CopilotChatInput` shows a disclaimer only when `positioning="absolute"` or `show-disclaimer` is set. [Slots](https://docs.copilotkit.ai/vue/claude-sdk-python/custom-look-and-feel/slots)
11. **Suggestions with `consumerAgentId: "*"` appear only after the first reply.** The demo sets the documented `consumerAgentId`. [Prebuilt Components](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components)

**Docs (content gaps or wrong framework)**

12. **Four pages bypass the Claude Agent SDK: Shared State, State Streaming, State Rendering and Sub-Agents.** Their published Python backends are raw `anthropic` Messages API code, not `ClaudeAgentAdapter`. They need `ANTHROPIC_API_KEY`, which the Claude Code CLI login does not provide, so every run here ends in `RUN_ERROR: TypeError: "Could not resolve authentication method…"`. The pages also leave out the run loops, the endpoints, and (Shared State, Sub-Agents) an imported `normalize_claude_model`. The repo fills those gaps, labelled NOT DOC CODE. They have never completed a run here, so with a key they may still fail. Earlier on this machine these runs failed one step sooner, on `import anthropic` (Windows Application Control blocked its `jiter` DLL). That block was gone when re-checked on 2026-11-13. [Shared State](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state), [State Streaming](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/streaming), [State Rendering](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/state-rendering), [Sub-Agents](https://docs.copilotkit.ai/vue/claude-sdk-python/multi-agent/subagents)
19. **State Rendering's frontend and backend share no state keys.** `ResearchProgress` reads `status` / `draft` / `completed` / `total`, but the only backend the page prints (the State Streaming snippet) writes just `document`, so even with a key the panel would stay "Idle". [State Rendering](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/state-rendering)
20. **Load sensitivity (harness, not docs).** On a busy machine a new Claude CLI can miss the SDK's 60s `initialize` handshake (`Control request timeout: initialize`). The backend raises it to 180s (`CLAUDE_CODE_STREAM_CLOSE_TIMEOUT`) and expires idle CLIs after 10 minutes.
13. **React-only code on Vue pages:** Inspector, Open Generative UI, A2UI (all three), JSON Render, Hashbrown, Connect AG-UI agents (empty code slots), Authentication (frontend), and the HITL Overview (a React `book_call` snippet with LangGraph `interrupt()` wording). These were ported to the Vue API where Vue packages exist.
14. **Python helpers that don't apply to this backend:** `from copilotkit import a2ui`, and `get_a2ui_tools()` from `ag_ui_langgraph` (A2UI pages). There are also undefined helpers (`_build_sdk_tools`, `execute_tool`) and no documented way to register a Python backend tool on `ClaudeAgentAdapter`. In-process MCP bridges fill these gaps, each labelled NOT DOC CODE.
15. **Tool Rendering field mismatch:** the Vue card uses `city`, but the published Python tool takes `location`. Kept as published.
16. **Model-router samples** import `createCopilotRuntimeHandler` but call `createCopilotEndpoint`. The AI SDK "With Tools" `ToolSet` doesn't typecheck against `ai@7`, and TanStack's `chat()` needs a `threadId`. [Use any model router](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/custom-agent)
17. **Typecheck failures in published samples:** `exportA2UICatalog(shopUI, …)` (TS2345), `render: <SFC>` in `useHumanInTheLoop` (TS2322), `openGenUiSandboxFunctions`, and the `labels` object. Each is widened with a cast; runtime behaviour is unchanged.
18. **Missing pieces on pages:** State and actions has no layout component in its catalog, no `useCartStore` and no `onChoose` component; MCP Apps uses the placeholder `mcp.example.com` (Excalidraw from the page's list is used instead); the Built-in Agent page is a TODO placeholder; the prebuilt-components pages link to `/vue/claude-sdk-python/vue/…` (404).

**Harness-only choices (not doc code)**

- All agents run with `ENABLE_CLAUDEAI_MCP_SERVERS=false` (`backend/src/agents/common.py`). Without it, the bundled CLI loads every claude.ai connector of the logged-in account (about 90 tools: Gmail, Drive, Asana…), which adds roughly 65K prompt tokens per run, and an agent once tried to call one.
- `FilePromptAdapter` sends system prompts over 8,000 characters as `--system-prompt-file`. Generative-UI catalogs otherwise exceed the Windows command-line limit.

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Every run: `Failed to start Claude Code: ` (blank) | You started uvicorn with `--reload`. On Windows the reloader uses the selector event loop, which can't spawn the CLI. Run `uv run python src/agent_server.py`. |
| `uvicorn.exe` "blocked by an Application Control policy" | Don't call the `uvicorn` shim; use `python src/agent_server.py` (or `python -m uvicorn`). |
| `Credit balance is too low` | An `ANTHROPIC_API_KEY` without credit is set and wins over the CLI login. Remove it from `backend/.env` or top it up. |
| Chat renders unstyled | `@copilotkit/vue/styles.css` must be imported once (it is, in `src/main.ts`). |
| No reply; console shows a CORS error | The runtime must run with `cors: true` (it does). Check that `VITE_RUNTIME_ORIGIN` matches the runtime port. |
| `curl :8300/api/copilotkit/info` lists no agents | The agent server isn't up, or `AGENT_URL` is wrong. The default endpoint discovers agents from `:8100/health` on each request. |
| 504 "Outdated Optimize Dep" / random full reloads | Two Vite servers shared one cache. Each port now has its own `node_modules/.vite-<port>`. Also avoid editing files during a recording. |
| Threads pages show "Loading…" / 503 | Expected without `CPK_INTELLIGENCE_API_KEY` (premium). The 503 body carries the runtime's own error. |
| Built-in Agent / model router: "API key is missing" | Those pages call models from Node; set the key in the runtime's environment (`frontend/.env`). |
| Port already in use | Another harness owns it. Set `AGENT_PORT` / `PORT` / `VITE_PORT` (and the matching `AGENT_URL` / `VITE_RUNTIME_ORIGIN`). |
| Autorecorder: `chrome.dll … blocked by an Application Control policy` | Your policy allows Chromium build 1234 but not 1254. `autorecorder/` pins `playwright@1.62.1` (build 1234) for that reason; don't upgrade it. |
| A step fails on the first prompt after a cold start | The first CLI start is slow. Re-run that page; `npm run record:each` isolates pages. |

The doc's own debugging advice also applies: the Inspector on any demo (AG-UI Events tab) and the runtime's `/info` endpoint are the fastest ways to see whether a run reached the agent.

## 10. Autorecorder

`autorecorder/` records one video per demo: it reads the doc page, shows the implementing code in a simulated VS Code, then drives the live demo and checks that the feature appeared (not just a reply).

```bash
cd autorecorder
npm install && npx playwright install chromium
npm run nav:check            # pages.config matches the app nav
npm run doctor               # adaptation is complete (doctor:online also probes live URLs)
npm run sweep                # loads all 94 routes and reports page errors (no prompts)
npm run record -- --list
npm run record -- --quickstart
npm run record:each          # all 43 demos, one process per page
npm run pages:generate       # after editing a demo or the nav
```

- Videos land in `autorecorder/videos/CLAUDESDK-PY-vue-<NN>-<Name>.webm` (gitignored; publish them as release assets).
- Broken pages fail their recording on purpose, with the reason in the log; the video shows the current behaviour.
- `tools/probe.ts <route> --prompt "…"` drives one demo headlessly and prints errors. It's the quickest single-page check.

Full run on 2026-11-13: all 43 demos recorded. 36 pass; 7 fail by design, matching their Broken status (Threads Drawer, Headless Threads, Fixed Schema A2UI, State Rendering, Shared State, State Streaming, SubAgents). Four pages (Catalogs, Standard Catalog, State and actions, Markdown Mode) first failed under machine load, before the CLI start-up timeout was raised, and passed on re-record. `videos/MANIFEST.md` lists every clip.

## 11. Project structure

```
backend/
  src/agent_server.py            FastAPI app: one POST /<agentId> per adapter, /health
  src/agents/common.py           build_adapter() + FilePromptAdapter (shared options)
  src/agents/registry.py         auto-imports every module in routes/
  src/agents/routes/
    quickstart.py                default agent
    section_a.py … section_f.py  agents per doc section (+ register(app) extras)
  src/agents/section_*/          tools, MCP bridges, schemas, prompts per section
frontend/
  server.ts                      Copilot Runtime: node:http + one listener per endpoint file
  runtime/agents.ts              HttpAgent helpers, backend agent discovery
  runtime/endpoints/*.ts         default.ts (/api/copilotkit) + one file per runtime config
  vite.config.ts                 ports, /api + /agent proxies, per-port dep cache
  src/main.ts                    app entry: styles, chart/map plugins, router
  src/router.ts                  routes generated from the nav
  src/lib/nav-config.ts          nav order; entries live in src/lib/nav/section-*.ts
  src/pages/<doc path>/Demo.vue  the live demo for that doc page (+ helpers beside it)
  src/pages/NotesPage.vue        generic notes route (header, try-it, notes, source)
  src/components/                NavSidebar, RouteHeader, StatusBadge, DemoFrame, …
autorecorder/                    recording suite (config/, actions/, core/ frozen, tools/)
doc-snapshot/                    raw markdown of every tracked doc page + manifest.json
.env.example                     every variable, by file
```

## 12. References

- **Getting Started:** [Introduction](https://docs.copilotkit.ai/vue/claude-sdk-python) · [Quickstart](https://docs.copilotkit.ai/vue/claude-sdk-python/quickstart)
- **Basics:** [Prebuilt Components](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components) ([Chat](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/chat), [Popup](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/popup), [Sidebar](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/sidebar), [Open, close, and feedback](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/chat-controls))
- **Custom Look and Feel:** [Slots](https://docs.copilotkit.ai/vue/claude-sdk-python/custom-look-and-feel/slots) · [Fully Headless UI](https://docs.copilotkit.ai/vue/claude-sdk-python/custom-look-and-feel/headless-ui) · [Programmatic Control](https://docs.copilotkit.ai/vue/claude-sdk-python/programmatic-control) · [Inspector](https://docs.copilotkit.ai/vue/claude-sdk-python/inspector)
- **Threads:** [Threads Drawer](https://docs.copilotkit.ai/vue/claude-sdk-python/prebuilt-components/copilot-threads-drawer) · [Headless Threads](https://docs.copilotkit.ai/vue/claude-sdk-python/headless-threads) · [Thread & History Lifecycle](https://docs.copilotkit.ai/vue/claude-sdk-python/threads-lifecycle)
- **Generative UI · Declarative:** [Components and surfaces](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components) · [Surfaces](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/surfaces) · [Catalogs](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/catalogs) · [Standard catalog](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/standard-catalog) · [State and actions](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/state-and-actions) · [Theming](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/theming) · [Transports](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/transports) · [Markdown mode](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/markdown-mode) · [Adopt from A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/components/from-a2ui) · [A2UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui) · [Fixed Schema](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/fixed-schema) · [Dynamic Schema](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/a2ui/dynamic-schema) · [JSON Render](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/json-render) · [Hashbrown](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/hashbrown)
- **Generative UI · Open-Ended and Tools:** [MCP Apps](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/mcp-apps) · [Open Generative UI](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/open-generative-ui) · [Tool Rendering](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/tool-rendering) · [Components as Tools](https://docs.copilotkit.ai/vue/claude-sdk-python/generative-ui/tool-based)
- **App Control:** [Frontend Tools](https://docs.copilotkit.ai/vue/claude-sdk-python/frontend-tools)
- **Shared State:** [Shared State](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state) · [Render agent state in your app](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/rendering-in-app) · [Agent Read-Only Context](https://docs.copilotkit.ai/vue/claude-sdk-python/shared-state/agent-readonly)
- **Human In The Loop:** [HITL Overview](https://docs.copilotkit.ai/vue/claude-sdk-python/human-in-the-loop) · [Governed Action Approval UI](https://docs.copilotkit.ai/vue/claude-sdk-python/human-in-the-loop/governed-actions)
- **Built-in Agent:** [Built-in Agent](https://docs.copilotkit.ai/vue/claude-sdk-python/built-in-agent) (sub-pages 404 for Vue; framework-neutral versions: [Server Tools](https://docs.copilotkit.ai/server-tools), [MCP servers](https://docs.copilotkit.ai/mcp-servers), [Advanced Configuration](https://docs.copilotkit.ai/advanced-configuration), [Model Selection](https://docs.copilotkit.ai/model-selection))
- **Runtime:** [Copilot Runtime](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/copilot-runtime) · [Runtime HTTP endpoints](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/runtime-endpoints) · [Use any model router](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/custom-agent) · [AgentRunner and persistence](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/agent-runner) · [Connect AG-UI agents](https://docs.copilotkit.ai/vue/claude-sdk-python/backend/ag-ui) · [Authentication](https://docs.copilotkit.ai/vue/claude-sdk-python/auth)
- **Multi-Agent:** [Sub-Agents](https://docs.copilotkit.ai/vue/claude-sdk-python/multi-agent/subagents)
