/** Worker E — Shared State, Human in the Loop, Sub-Agents.
 *
 * Each entry is one doc route. Edit only this file for this section. */
import { P, type RouteMeta } from "./types";

const RUN_AUTH_ERROR =
  "TypeError: \"Could not resolve authentication method. Expected one of api_key, auth_token, or credentials to be set…\"";

/** Shared note for the two pages whose published backend is a raw Messages API loop. */
const ANTHROPIC_IMPORT_NOTE = {
  title: "Observed failure: the page's backend needs ANTHROPIC_API_KEY",
  tone: "warn" as const,
  html: `The page's backend calls <code>anthropic.AsyncAnthropic()</code>, a direct Messages API client, not <code>ClaudeAgentAdapter</code>. It needs <code>ANTHROPIC_API_KEY</code>; the Claude Code CLI login that every adapter route here uses does not authenticate it, and <code>backend/.env</code> has no key. Every run therefore ends in an AG-UI <code>RUN_ERROR</code> (<code>${RUN_AUTH_ERROR}</code>). Not worked around. Re-verified 2026-11-13. An earlier run on this machine failed one step sooner, on <code>import anthropic</code> (Windows Application Control blocked its <code>jiter</code> DLL); that block is no longer present.`,
};

export const sharedState: RouteMeta[] = [
  {
    path: "/shared-state",
    title: "Shared State",
    docPath: "shared-state",
    summary:
      "Two-way state between a Vue panel and the agent. `useAgent({ agentId: \"workspace\", updates: [OnStateChanged] })` renders agent-written `notes`, and `agent.setState(...)` writes UI `preferences`. The page's Python backend is its own raw Anthropic Messages API loop with a `set_notes` tool, mounted at `POST /shared-state-read-write`. It does not use ClaudeAgentAdapter.",
    status: "broken",
    statusNote: `Every run ends in RUN_ERROR "${RUN_AUTH_ERROR}" because the page's backend needs ANTHROPIC_API_KEY (raw Messages API, not the adapter). The agent never reads or writes state. Only the client-side setState shows up, in the panel.`,
    hasDemo: true,
    agentId: "workspace",
    runtimePath: "/api/copilotkit-section-e",
    tryIt: {
      prompts: ["Click “Prefer concise answers”", "Please remember that my favourite colour is teal."],
      expect:
        "The click sets `tone: concise` in the panel immediately (client-side setState). With a working backend the agent would call `set_notes`, a teal note would appear under Notes, and the reply would be concise.",
      fail: `What happens here: no reply, Notes stays empty, and the stream carries RUN_ERROR "${RUN_AUTH_ERROR}".`,
    },
    sources: P(
      "/shared-state",
      "frontend/src/pages/shared-state/SharedWorkspace.vue",
      "backend/src/agents/section_e/shared_state_read_write_agent.py",
      "backend/src/agents/routes/section_e.py",
      "frontend/runtime/endpoints/section-e.ts",
    ),
    notes: [
      {
        title: "The page's backend is a raw Messages API loop, built as printed",
        tone: "info",
        html: "The page publishes <code>SYSTEM_PROMPT</code>, <code>SET_NOTES_TOOL</code>, <code>build_preferences_block</code>, <code>_state_dict</code>, the <code>client.messages.stream(...)</code> call, the <code>set_notes</code> → <code>StateSnapshotEvent</code> write-back and the <code>@app.post(\"/shared-state-read-write\")</code> endpoint. Its callout says the route uses neither <code>ClaudeAgentAdapter</code> nor an MCP server. All of it is in <code>backend/src/agents/section_e/shared_state_read_write_agent.py</code> and <code>routes/section_e.py</code>, unchanged. The adapter's own <code>ag_ui_update_state</code> tool was <em>not</em> swapped in to make the route work. That would replace the page's mechanism.",
      },
      ANTHROPIC_IMPORT_NOTE,
      {
        title: "Gaps filled (NOT DOC CODE)",
        tone: "warn",
        html: "The page never publishes the function that holds its fragments (<code>run_shared_state_read_write_agent</code>). It also leaves out <code>normalize_claude_model</code>, <code>DEFAULT_ANTHROPIC_MODEL</code>, <code>client</code>, <code>messages</code>, <code>msg_id</code> and <code>encoder</code>. A minimal loop supplies them, marked NOT DOC CODE. It has never run here, because the import fails first. The runtime endpoint <code>/api/copilotkit-section-e</code> is harness plumbing: <code>register(app)</code> mounts the route rather than an adapter, so <code>default.ts</code> cannot discover it from <code>/health</code>. The endpoint binds the page's agent id <code>workspace</code> to that path. The page itself uses <code>runtime-url=\"/api/copilotkit\"</code>.",
      },
      {
        title: "Shared State page vs. the adapter's own state channel",
        tone: "info",
        html: "<code>ClaudeAgentAdapter</code> already does shared state: it appends <code>input.state</code> to the system prompt and adds an <code>ag_ui_update_state</code> tool whenever state is present. See <a href=\"/shared-state/rendering-in-app\">Render agent state in your app</a>, which works through it. This page's Python snippets don't use that path.",
      },
    ],
  },
  {
    path: "/shared-state/rendering-in-app",
    title: "Render agent state in your app",
    docPath: "shared-state/rendering-in-app",
    summary:
      "A main-view `Canvas` reads `agent.state` through `useAgent()` and renders it outside the chat. It seeds UI-owned initial state with `setState`, and item clicks write back with `setState`. The chat beside it shares the same agent. The ClaudeAgentAdapter receives the canvas as `input.state` and writes changes back with its built-in `ag_ui_update_state` tool.",
    status: "working",
    statusNote:
      "Verified: a click toggled an item, then one prompt renamed the canvas and added an item. The canvas re-rendered from STATE_SNAPSHOT and kept the click.",
    hasDemo: true,
    agentId: "shared-state-rendering-in-app",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: [
        "Click “Build a prototype” to tick it",
        "Rename the project to 'Spring launch' and add an item 'Write launch blog post'.",
      ],
      expect:
        "The click ticks the item at once. After the prompt, the canvas heading becomes “Spring launch” and a third item appears. The prototype item stays ticked, because the agent read the UI's write.",
      fail: "The canvas never changes after the reply, or the heading stays “Project launch”.",
    },
    sources: P(
      "/shared-state/rendering-in-app",
      "frontend/src/pages/shared-state/rendering-in-app/Canvas.vue",
      "backend/src/agents/routes/section_e.py",
    ),
    notes: [
      {
        title: "Default agent → named agent without touching the page's components",
        tone: "info",
        html: "The page's <code>useAgent()</code> and <code>&lt;CopilotChat /&gt;</code> both resolve the default agent. This harness gives every route its own agent, so <code>Demo.vue</code> wraps them in <code>CopilotChatConfigurationProvider agent-id=\"shared-state-rendering-in-app\"</code> (NOT DOC CODE). Both fall back to that id. <code>Canvas.vue</code>'s script is the page's, plus the page's <code>toggleItem</code> wired to a click.",
      },
      {
        title: "Backend: plain ClaudeAgentAdapter",
        tone: "info",
        html: "The page publishes no backend. It says that if the backend owns initial state, you should define it in the framework's shared-state setup. Here the UI owns it, as in the sample. The adapter appends the state JSON to the system prompt and exposes <code>ag_ui_update_state</code>, a shallow merge. The repo-authored prompt tells the agent to keep every existing item when it writes <code>items</code>.",
      },
    ],
  },
  {
    path: "/shared-state/streaming",
    title: "State Streaming",
    docPath: "shared-state/streaming",
    summary:
      "`StreamingDocument` reads `agent.value.state.document` through `useAgent({ agentId: \"writer\", updates: [OnStateChanged, OnRunStatusChanged] })` and shows a LIVE badge while `agent.isRunning`. The page's Python backend, `stream_document_state`, walks a raw Anthropic Messages API stream. Each time the partial `write_document.document` argument grows, it sets `state.document` and emits STATE_SNAPSHOT, so the text should grow token by token. It is not ClaudeAgentAdapter.",
    status: "broken",
    statusNote:
      "Every run ends in RUN_ERROR \"TypeError: \\\"Could not resolve authentication method. Expected one of api_key, auth_token, or credentials to be set. Or for the `Authorization` header to be explicitly omitted\\\"\": the page's raw Anthropic loop needs ANTHROPIC_API_KEY, which this machine doesn't have. No document is ever streamed.",
    hasDemo: true,
    agentId: "writer",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Write a three-paragraph essay about why lighthouses matter."],
      expect:
        "Per the page: the LIVE badge shows, the essay text grows in place while the tool argument streams (the “document updates this run” counter climbs well past 1), and then the badge goes away.",
      fail:
        "What happens here: LIVE flashes, “Waiting for a draft…” stays, the counter stays at 0, and the raw events end in RUN_ERROR “Could not resolve authentication method…”.",
    },
    sources: P(
      "/shared-state/streaming",
      "frontend/src/pages/shared-state/streaming/StreamingDocument.vue",
      "backend/src/agents/section_g/state_streaming_backend.py",
      "backend/src/agents/section_g/state_streaming_agent.py",
      "backend/src/agents/routes/section_g.py",
    ),
    notes: [
      {
        title: "The page's backend is a raw Messages API stream handler, built as printed",
        tone: "info",
        html: "<code>state_streaming_backend.py</code> is the page's <code>state_streaming_backend.snippet.py</code>, verbatim. The <code>agent.py</code> step is the same <code>write_document</code> branch. The page describes direct SDK adapters emitting <code>STATE_SNAPSHOT</code> from their own streaming loop, and the handler reads raw <code>input_json_delta</code> events from an Anthropic SDK stream. <code>ClaudeAgentAdapter</code> consumes the model stream internally and never hands one out, and its <code>ag_ui_update_state</code> tool only writes once the tool call completes. Neither was swapped in.",
      },
      {
        title: "Observed failure: no Anthropic API key",
        tone: "warn",
        html: "<code>import anthropic</code> works in this run (anthropic 2.8.0, <code>jiter</code> loads), but <code>anthropic.AsyncAnthropic()</code> needs <code>ANTHROPIC_API_KEY</code>. <code>backend/.env</code> has none, and the Claude Code CLI login does not authenticate the raw Messages API. The stream fails with <code>TypeError: \"Could not resolve authentication method. Expected one of api_key, auth_token, or credentials to be set. Or for the `Authorization` header to be explicitly omitted\"</code>, which reaches the browser as an AG-UI <code>RUN_ERROR</code> right after RUN_STARTED. This is not worked around. The streaming path has never run here.",
      },
      {
        title: "Gaps filled (NOT DOC CODE)",
        tone: "warn",
        html: "The page never shows the code that opens <code>anthropic_stream</code>, sends <code>WRITE_DOCUMENT_TOOL_SCHEMA</code> to Claude, frames the AG-UI run or mounts an endpoint. <code>state_streaming_agent.py</code> is a minimal one-turn loop around the unchanged <code>stream_document_state</code>, with a repo-authored prompt and no tool_result round trip. The page's “final return value is written to the same key” step is therefore just the last streamed snapshot. <code>routes/section_g.py</code> mounts it at <code>POST /shared-state-streaming</code> with <code>register(app)</code>. That route is absent from <code>/health</code>, so <code>Demo.vue</code> adds the page's agent id <code>writer</code> as a local <code>HttpAgent</code> (<code>agents__unsafe_dev_only</code>, through Vite's <code>/agent</code> proxy) and keeps the page's <code>runtime-url</code>. The update counter and the raw-events panel are debug aids.",
      },
    ],
  },
  {
    path: "/shared-state/agent-readonly",
    title: "Agent Read-Only Context",
    docPath: "shared-state/agent-readonly",
    summary:
      "`useAgentContext({ description: \"Active workspace\", value: workspaceId })` publishes a ref to the agent as one-way context. The ClaudeAgentAdapter appends it to the system prompt on every turn as `- Active workspace: <value>`.",
    status: "working",
    statusNote:
      "Verified: after switching the select to “aurora”, the agent answered “aurora”. The context value cannot be changed by the agent, although the adapter still gives it a generic state tool (see notes).",
    hasDemo: true,
    agentId: "shared-state-agent-readonly",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Switch the select to “aurora”", "Which workspace am I in?"],
      expect: "The reply names “aurora”, the value the select had when the message was sent.",
      fail: "The agent says it doesn't know, or names a workspace other than the one selected.",
    },
    sources: P(
      "/shared-state/agent-readonly",
      "frontend/src/pages/shared-state/agent-readonly/WorkspaceContext.vue",
      "backend/src/agents/routes/section_e.py",
    ),
    notes: [
      {
        title: "No backend code needed",
        tone: "success",
        html: "The adapter's <code>build_state_context_addendum</code> turns every <code>input.context</code> entry into a <code>## Context from the application</code> line in the system prompt, so this route runs on a plain adapter. <code>Demo.vue</code> points the page's <code>&lt;CopilotChat /&gt;</code> at this route's agent with <code>CopilotChatConfigurationProvider</code> (NOT DOC CODE).",
      },
      {
        title: "“Never sees a setter or mutation tool” doesn't hold with this adapter",
        tone: "warn",
        html: "CopilotKit sends <code>state: {}</code> on every run. The adapter adds its <code>ag_ui_update_state</code> tool whenever <code>state</code> is not null, even when no shared state is used. Asked to “switch it to tidewater”, the agent called <code>ag_ui_update_state({activeWorkspace: \"tidewater\"})</code> and replied “Workspace switched”. The context value and the UI stayed on “aurora”, so the read-only guarantee holds for the context itself. But the model does have a mutation tool, and it will claim success.",
      },
    ],
  },
];

export const hitl: RouteMeta[] = [
  {
    path: "/human-in-the-loop",
    title: "HITL Overview",
    docPath: "human-in-the-loop",
    summary:
      "Pattern 1: `useHumanInTheLoop({ name: \"schedule_meeting\", parameters, render: TimePickerCard })`. The agent calls the tool, the run pauses on a picker card in the chat, and the user's pick returns to the agent as the tool result. Pattern 2 (`useInterrupt`) is only linked from this page; its walkthrough is a separate page.",
    status: "working",
    statusNote:
      "Verified: the agent called schedule_meeting, the picker rendered, and clicking a slot resumed the run. The reply confirmed that slot.",
    hasDemo: true,
    agentId: "human-in-the-loop",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Book an intro call about the Q3 roadmap with Alice from Sales.", "(click a time slot)"],
      expect:
        "A violet “Pick a time” card appears with four slots. After a click it shows “Picked: …” and the agent confirms that time.",
      fail: "The card never shows buttons (stuck on “Preparing…”), or the agent never replies after the click.",
    },
    sources: P(
      "/human-in-the-loop",
      "frontend/src/pages/human-in-the-loop/MeetingApproval.vue",
      "frontend/src/pages/human-in-the-loop/TimePickerCard.vue",
      "backend/src/agents/routes/section_e.py",
    ),
    notes: [
      {
        title: "TimePickerCard is not published",
        tone: "info",
        html: "The page passes <code>render: TimePickerCard</code> but never shows the component, only that it may use static candidate slots. <code>TimePickerCard.vue</code> is repo-authored (NOT DOC CODE). It takes the render props <code>args</code> / <code>status</code> / <code>respond</code> and answers with <code>{ chosen_time }</code>.",
      },
      {
        title: "`render: TimePickerCard` fails vue-tsc as printed",
        tone: "warn",
        html: "<code>VueHumanInTheLoopRenderFn&lt;T&gt;</code> accepts <code>Component&lt;VueHumanInTheLoopRenderProps&lt;T&gt;&gt;</code>. That union requires <code>name</code>, <code>description</code> and <code>toolCallId</code> on the component's props, so an SFC declaring only what it uses fails with TS2322. The line is kept and widened with <code>as never</code>. It runs fine.",
      },
      {
        title: "React snippet on a Vue page",
        tone: "info",
        html: "The Claude-specific step shows a React <code>useHumanInTheLoop</code> (<code>book_call</code>, JSX render, <code>agentId: \"hitl-in-chat\"</code>). The Vue section below it (<code>schedule_meeting</code>) is what is implemented. The pattern table also says <code>useInterrupt</code> pauses come from “the graph” calling <code>interrupt(...)</code>, which is LangGraph wording. <code>ClaudeAgentAdapter</code> has no graph.",
      },
    ],
  },
  {
    path: "/human-in-the-loop/governed-actions",
    title: "Governed Action Approval UI",
    docPath: "human-in-the-loop/governed-actions",
    summary:
      "A `GovernedAction` envelope (`id`, `summary`, `tool`, `reference`, `verdict`, `arguments`) gated two ways. `useInterrupt({ renderInChat: false })` reads `interrupt.metadata.action`. `useHumanInTheLoop(\"approve_governed_action\")` renders `GovernedActionCard`, which auto-resolves `allow` / `deny` and asks the user on `require_approval`.",
    status: "partial",
    statusNote:
      "require_approval works: Approve and Reject both resume the run. allow and deny don't: the card shows “Allowed/Blocked by policy · Decision sent.”, but the run never resumes and no follow-up request is sent. The useInterrupt panel never receives an interrupt.",
    hasDemo: true,
    agentId: "human-in-the-loop-governed-actions",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: [
        "Send an email to bob@example.com saying the launch moved to Friday.",
        "(click Approve and run)",
        "Apply a 50% discount to order 1042.",
      ],
      expect:
        "Email: an amber card shows “User approval required”, the tool, reference and arguments. After Approve, the agent says the email would now be sent. Discount: the card shows “Blocked by policy”.",
      fail: "Observed for allow/deny: the card shows “Decision sent.” and the chat stops there. No agent reply follows.",
    },
    sources: P(
      "/human-in-the-loop/governed-actions",
      "frontend/src/pages/human-in-the-loop/governed-actions/GovernedActionApproval.vue",
      "frontend/src/pages/human-in-the-loop/governed-actions/GovernedActionTool.vue",
      "frontend/src/pages/human-in-the-loop/governed-actions/GovernedActionCard.vue",
      "backend/src/agents/routes/section_e.py",
    ),
    notes: [
      {
        title: "Auto-resolve for allow / deny never reaches the agent",
        tone: "warn",
        html: "The page's card calls <code>respond</code> from a <code>watchEffect</code> as soon as <code>verdict</code> is <code>allow</code> or <code>deny</code> and <code>respond</code> exists. In <code>@copilotkit/vue</code> 1.87.0, the HITL <code>respond</code> is <code>async (v) =&gt; { if (resolver) … }</code>. It does nothing unless the tool handler has already stored its promise resolver. The card switches to “Decision sent.” (<code>submitted = true</code>, so it never retries). But no <code>TOOL_CALL_RESULT</code> and no follow-up <code>/run</code> POST were sent in either case, while a human click on the same card resumes normally. Likely cause: core emits <code>onToolExecutionStart</code>, which flips the render to <code>Executing</code>, and awaits subscribers <em>before</em> calling <code>tool.handler</code>. The watcher fires in that gap. Kept as printed.",
      },
      {
        title: "useInterrupt half: no interrupt ever arrives",
        tone: "warn",
        html: "The page publishes no backend for the interrupt path; it says “if your runtime can pause an agent run”. <code>GovernedActionApproval.vue</code> mounts without error and stays idle. <code>ClaudeAgentAdapter</code> emits AG-UI interrupts only for tools listed in its <code>defer_tools</code>. Their metadata is <code>{ source: \"claude-sdk-deferred\", toolName, input }</code>, never <code>action</code>, and resuming them requires <code>{ behavior: \"allow\" | \"deny\" }</code>, not <code>{ approved, actionId, reference }</code>. So the page's component would not render one even if it came. The page's <code>handleApproval</code> resume snippet is TypeScript and has no Python counterpart.",
      },
      {
        title: "Verdicts come from the model here",
        tone: "info",
        html: "The guardrails say to check policy on the server. The page publishes no policy engine, so the repo-authored system prompt gives the model a toy policy (discount over 20% → deny, internal-only → allow, else require_approval) and has it fill in the envelope. <code>Demo.vue</code> scopes the page's agent-less tree with <code>CopilotChatConfigurationProvider</code> (NOT DOC CODE). <code>render: GovernedActionCard</code> fails vue-tsc as printed (TS2322: the card's props lack <code>name</code>/<code>description</code>/<code>toolCallId</code>), so it is widened with <code>as never</code>.",
      },
    ],
  },
];

export const subagents: RouteMeta[] = [
  {
    path: "/multi-agent/subagents",
    title: "SubAgents",
    docPath: "multi-agent/subagents",
    summary:
      "A supervisor exposes research, writing and critique sub-agents as tools (`SUPERVISOR_TOOLS`). Each delegation is recorded in a `delegations` state slot that the UI renders as a live log. As printed, the backend is a raw Anthropic Messages API loop, and each sub-agent is a single-shot `_invoke_sub_agent` call.",
    status: "broken",
    statusNote: `Every run ends in RUN_ERROR "${RUN_AUTH_ERROR}". The page's backend needs ANTHROPIC_API_KEY (raw Messages API). No delegation is ever logged.`,
    hasDemo: true,
    agentId: "subagents",
    runtimePath: "/api/copilotkit-section-e",
    tryIt: {
      prompts: ["Write a short paragraph about why the Wright brothers' first flight mattered."],
      expect:
        "With a working backend: Research, Writing and Critique entries appear in the delegation log as “running”, then “completed”, and the supervisor sums up in the chat.",
      fail: `What happens here: no reply, the log stays at “Delegation log (0)”, and the stream carries RUN_ERROR "${RUN_AUTH_ERROR}".`,
    },
    sources: P(
      "/multi-agent/subagents",
      "frontend/src/pages/multi-agent/subagents/DelegationLog.vue",
      "backend/src/agents/section_e/subagents_agent.py",
      "backend/src/agents/routes/section_e.py",
      "frontend/runtime/endpoints/section-e.ts",
    ),
    notes: [
      {
        title: "Built from the page's Python, gaps marked",
        tone: "info",
        html: "<code>SUB_AGENT_PROMPTS</code>, <code>SUPERVISOR_SYSTEM_PROMPT</code>, <code>_delegation_tool_schema</code>, <code>SUPERVISOR_TOOLS</code> and <code>_invoke_sub_agent</code> are verbatim; the page prints the tool schemas three times. Not published, so NOT DOC CODE: <code>normalize_claude_model</code> (imported from a module the page never shows) and <code>run_subagents_agent</code>, the “subagents-delegation-flow region” the comments point to. The loop here does what the prose lists: run the sub-agent, record the delegation by stable <code>id</code>, return its text as a <code>tool_result</code>. It also needs its own route (<code>POST /multi-agent-subagents</code>) and runtime binding (<code>/api/copilotkit-section-e</code>).",
      },
      ANTHROPIC_IMPORT_NOTE,
      {
        title: "“Rendering a live delegation log” has no code",
        tone: "warn",
        html: "That section is a heading followed by empty space; no Vue or React snippet is published. <code>DelegationLog.vue</code> is repo-authored (NOT DOC CODE). It reads <code>agent.state.delegations</code> with the Shared State page's <code>useAgent</code> pattern.",
      },
      {
        title: "Not used: the Claude Agent SDK's own subagents",
        tone: "info",
        html: "The Claude Agent SDK has native subagents (<code>ClaudeAgentOptions(agents=…)</code> plus the <code>Task</code> tool), and <code>ag_ui_claude_sdk</code> streams them as <code>claude-subagent-task</code> activity events. The page never mentions either. Using them would replace the page's mechanism, so they are not used here.",
      },
    ],
  },
];
