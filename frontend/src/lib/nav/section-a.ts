/** Worker A — Basics, Custom Look and Feel, Threads.
 *
 * Each entry is one doc route. Edit only this file for this section. */
import { P, type RouteMeta } from "./types";

const BACKEND = "backend/src/agents/routes/section_a.py";
const THREADS_RUNTIME = "frontend/runtime/endpoints/section-a-threads.ts";

const INTELLIGENCE_ERROR =
  "CopilotKitIntelligence `apiKey` is required and cannot be blank. It is the CopilotKit Intelligence project API key, normally read from the CPK_INTELLIGENCE_API_KEY environment variable. Run `copilotkit project select` to provision one for your project.";

const threadsRuntimeNote = {
  title: "The prescribed runtime cannot be built without Intelligence",
  tone: "warn" as const,
  html:
    "<code>runtime/endpoints/section-a-threads.ts</code> builds the runtime the threads pages prescribe: <code>new CopilotRuntime({ agents, intelligence: new CopilotKitIntelligence({ apiKey: process.env.CPK_INTELLIGENCE_API_KEY! }), identifyUser })</code>. " +
    "CopilotKit Intelligence is not configured in this harness. With no key, the constructor throws:<br><code>" +
    INTELLIGENCE_ERROR +
    "</code><br>No fallback runner is swapped in. <b>Requires premium. Not testable locally.</b>",
};

const guardNote = {
  title: "NOT DOC CODE: 503 guard in the endpoint file",
  tone: "info" as const,
  html: "If the endpoint threw at import time, it would take down <code>server.ts</code> and every other runtime path with it. So when construction fails, <code>/api/copilotkit-section-a-threads</code> answers <b>503</b> with the constructor's own message. The browser then shows the real error (<code>Failed to load runtime info … status 503: CopilotKitIntelligence `apiKey` is required …</code>).",
};

const localThreadsNote = {
  title: "Observed: the stock runtime advertises local thread endpoints",
  tone: "info" as const,
  html: "In @copilotkit/runtime 1.87.0 the default <code>InMemoryAgentRunner</code> sets <code>ɵsupportsLocalThreadEndpoints</code>. At startup the plain <code>/api/copilotkit</code> runtime logs: <i>\"Listing and clearing threads need a caller identity. Pass identifyUser … or threads: { access: &quot;open&quot; } … Until then, GET /threads and POST /threads/clear return HTTP 403.\"</i> The threads docs never mention a local (non-Intelligence) thread list, so it is not used here. It is recorded only as a lead.",
};

export const basics: RouteMeta[] = [
  {
    path: "/prebuilt-components",
    title: "Prebuilt Components",
    docPath: "prebuilt-components",
    summary:
      "`CopilotChat`, `CopilotSidebar` and `CopilotPopup` on one agent, one tab each, with starter suggestions from `useConfigureSuggestions`. The sub-pages are folded in: chat events, sidebar `default-open`/`width`, popup `width`/`height`/`click-outside-to-close`, the custom `#toggle-button` launcher (open/close), and 👍/👎 feedback through `message-view` → `assistant-message`.",
    status: "working",
    statusNote:
      "Verified: all three surfaces stream replies. Suggestion pills, @select-suggestion/@submit-message, @thumbs-up/@thumbs-down and the custom toggle-button (isOpen/toggle) all work.",
    hasDemo: true,
    agentId: "prebuilt-components",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Write me a haiku about Vue.", "Name one planet."],
      expect:
        "CopilotChat tab: the reply streams in, and 👍/👎 add `feedback {messageId, value}` lines to the Chat events panel. Sidebar tab: the bottom-left button reads Close sidebar / Open sidebar and toggles the dock. Popup tab: “Ask the assistant” opens the window, the button becomes “Close chat”, and clicking outside closes it.",
      fail: "No suggestion pills on the welcome screen, or the feedback log stays empty after clicking 👍.",
    },
    sources: P(
      "/prebuilt-components",
      "frontend/src/pages/prebuilt-components/ChatWithFeedback.vue",
      "frontend/src/pages/prebuilt-components/Suggestions.vue",
      BACKEND,
    ),
    notes: [
      {
        title: "Sub-pages folded into this demo",
        tone: "info",
        html: "<b>chat</b>: <code>agent-id</code>, <code>auto-scroll</code>, and the <code>@submit-message</code>, <code>@select-suggestion</code> and <code>@stop</code> events, logged on screen. <b>sidebar</b>: <code>:default-open=\"true\"</code>, <code>:width</code>, <code>#toggle-button</code>. <b>popup</b>: <code>:default-open=\"false\"</code>, <code>width</code>/<code>height</code>, <code>click-outside-to-close</code>, <code>#toggle-button</code>. <b>chat-controls</b>: the <code>#toggle-button=\"{ isOpen, toggle }\"</code> sample and the <code>ChatWithFeedback.vue</code> sample. In that sample, <code>analytics.track</code> is replaced by an on-screen log.",
      },
      {
        title: "Suggestions need consumerAgentId to show before the first message",
        tone: "warn",
        html: "The page names <code>useConfigureSuggestions</code> but shows no config. With the default consumer (<code>\"*\"</code>), the Vue composable reloads suggestions only for agents that are already registered when it mounts. The runtime's agents arrive after <code>/info</code>, so the pills appeared only <i>after</i> the first reply, never on the welcome screen. Setting <code>consumerAgentId: \"prebuilt-components\"</code> (a documented field) makes them show from the start.",
      },
      {
        title: "Same conversation across tabs",
        tone: "info",
        html: "All three surfaces use the same <code>agent-id</code> under one provider, so they share one agent instance and one thread. A reply from the Sidebar tab is still there when you open the Popup.",
      },
    ],
  },
];

export const customLook: RouteMeta[] = [
  {
    path: "/custom-look-and-feel/slots",
    title: "Slots",
    docPath: "custom-look-and-feel/slots",
    summary:
      "The page's slot samples in one `CopilotChat`. `welcome-screen` is replaced. `message-view` is composed with classes, and inside it `assistant-message` → `toolbar-items` (a “Reviewed” badge) and `copy-button` (“Copy response”). `user-message` renders a custom component. `input` → `disclaimer` is wired as the page shows, and `labels` sets the placeholder.",
    status: "partial",
    statusNote:
      "Welcome, message-view, assistant toolbar-items, copy-button, user-message and labels all render. The page's disclaimer slot sample renders nothing: CopilotChatInput only shows a disclaimer when positioning is \"absolute\" or show-disclaimer is set, and the input slot props carry neither.",
    hasDemo: true,
    agentId: "custom-look-and-feel-slots",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["(click) Show my open tickets", "Which one is most urgent?"],
      expect:
        "The custom “How can we help?” card is the empty state. User messages show as indigo bubbles with a “YOU” tag. Each assistant reply has a green “Reviewed” badge and a “Copy response” link instead of the copy icon. The composer placeholder is “Ask your agent anything…”.",
      fail: "The default “How can I help you today?” welcome, or the default copy icon without a Reviewed badge.",
    },
    sources: P("/custom-look-and-feel/slots", "frontend/src/pages/custom-look-and-feel/slots/CustomUserMessage.vue", BACKEND),
    notes: [
      {
        title: "Disclaimer slot sample renders nothing (kept as the page writes it)",
        tone: "warn",
        html: "The page's sample is <code>&lt;template #input=\"inputProps\"&gt;&lt;CopilotChatInput v-bind=\"inputProps\"&gt;&lt;template #disclaimer&gt;…</code>. In @copilotkit/vue 1.87.0, <code>CopilotChatInput</code> renders its disclaimer only when <code>showDisclaimer ?? positioning === \"absolute\"</code>. The <code>input</code> slot props (<code>CopilotChatInputSlotProps</code>) include neither, so <code>positioning</code> defaults to <code>\"static\"</code>. Neither “Responses may be inaccurate.” nor the default disclaimer appears. Adding <code>:show-disclaimer=\"true\"</code> would probably fix it, but the page does not say to, so it is not added.",
      },
      {
        title: "Welcome-screen slot drops the composer",
        tone: "info",
        html: "The page's <code>#welcome-screen</code> sample renders only a heading and a button, so there is no text input until the first message is sent. That is the page's markup, kept as-is. The slot props include the input props if you want to render one.",
      },
      {
        title: "labels typing",
        tone: "info",
        html: "<code>CopilotChatLabels</code> in 1.87.0 types each field as its default <i>literal</i> string (e.g. <code>\"Type a message...\"</code>), so the page's inline <code>:labels</code> object fails <code>vue-tsc</code>. The demo casts the object. The values are the page's.",
      },
      {
        title: "Agent prompt has a fixed ticket list (NOT DOC CODE)",
        tone: "info",
        html: "The welcome button sends “Show my open tickets”. Without data, Claude claimed to be “searching your Drive”. The agent prompt now holds three made-up tickets, so the reply is coherent.",
      },
    ],
  },
  {
    path: "/custom-look-and-feel/headless-ui",
    title: "Fully Headless UI",
    docPath: "custom-look-and-feel/headless-ui",
    summary:
      "Both of the page's examples under one `CopilotKitProvider` and one `CopilotChatConfigurationProvider`, with no `CopilotChat` shell. On the left is the minimal `HeadlessChat.vue` (`useAgent` + `useCopilotKit().runAgent`, text only). On the right is the complete `RenderedMessages.vue`: `CopilotChatMessageView` with custom bubble chrome around the public assistant and user leaves.",
    status: "working",
    statusNote:
      "Verified: a message sent from the custom composer streams into both panes. The left pane shows raw text; the right pane renders markdown inside the custom bubbles.",
    hasDemo: true,
    agentId: "custom-look-and-feel-headless-ui",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Give me a two-item markdown list of fruits."],
      expect:
        "The left pane shows the reply as plain text (`- Apple`). The right pane shows the same reply rendered as a bulleted list, with an accent border on the left (assistant bubble) and a grey border on the right (user bubble).",
      fail: "Nothing appears in the right pane, or the left composer does nothing.",
    },
    sources: P(
      "/custom-look-and-feel/headless-ui",
      "frontend/src/pages/custom-look-and-feel/headless-ui/HeadlessChat.vue",
      "frontend/src/pages/custom-look-and-feel/headless-ui/RenderedMessages.vue",
      BACKEND,
    ),
    notes: [
      {
        title: "Minimal example only renders text, as the page warns",
        tone: "info",
        html: "<code>{{ message.content }}</code> prints raw markdown and skips reasoning messages, tool calls and activity messages. The page states that trade-off. The right pane is the page's answer to it.",
      },
    ],
  },
  {
    path: "/programmatic-control",
    title: "Programmatic Control",
    docPath: "programmatic-control",
    summary:
      "The page's `AgentTrigger.vue`, with no chat UI. “Run agent” calls `agent.addMessage(…)` and then `copilotkit.runAgent({ agent: toRaw(agent) })`, and “Stop” calls `copilotkit.stopAgent`. The page's `agent.subscribe` watch logs `onRunStartedEvent`, `onRunFinalized` and `onRunFailed` on screen, and `agent.messages` is shown read-only.",
    status: "working",
    statusNote: "Verified: Run adds the user message and streams a sales summary. Stop aborts mid-run. The subscribe log shows started → done for both.",
    hasDemo: true,
    agentId: "programmatic-control",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["(click) Run agent", "(click) Run agent, then Stop within ~2s"],
      expect:
        "The agent.subscribe log shows “started” and then “done”. agent.messages shows “user: Summarize the latest sales data” and then an assistant summary with a total of $962,600.",
      fail: "No “started” line in the log, or the Run button stays disabled.",
    },
    sources: P("/programmatic-control", "frontend/src/pages/programmatic-control/AgentTrigger.vue", BACKEND),
    notes: [
      {
        title: "Sales data lives in the agent prompt (NOT DOC CODE)",
        tone: "info",
        html: "The page's button sends “Summarize the latest sales data” but never says where that data comes from. The <code>programmatic-control</code> agent's system prompt holds a small fixed Q3 table so the reply has something to summarize.",
      },
      {
        title: "Sections with no Vue code",
        tone: "info",
        html: "“Resolving a frontend tool call from a button” describes <code>useHumanInTheLoop</code> but publishes no sample on this page, so it is not built here. It is covered by the Human-in-the-Loop routes.",
      },
      {
        title: "Reasoning messages appear in agent.messages",
        tone: "info",
        html: "Claude's extended thinking reaches the client as a <code>reasoning</code> message with empty visible content, which this raw list prints as <code>reasoning:</code>. This is expected for a raw view.",
      },
    ],
  },
  {
    path: "/inspector",
    title: "Inspector",
    docPath: "inspector",
    summary:
      "A `CopilotChat` under a provider whose `:enable-inspector` follows a checkbox. With it on, the floating Inspector launcher opens the overlay (Home, Agent, AG-UI Events, Context, Rich Threads, Automatic Learning). With it off, the `cpk-web-inspector` element is not mounted.",
    status: "partial",
    statusNote:
      "Home (Runtime Available, RUN_FINISHED), Agent and AG-UI Events work, and :enable-inspector=\"false\" removes the overlay. Rich Threads, Try from here, View in your app and Automatic Learning are locked (Intelligence is off). Requires premium, not testable locally.",
    hasDemo: true,
    agentId: "inspector",
    runtimePath: "/api/copilotkit",
    reactOnlyDoc: true,
    tryIt: {
      prompts: ["(click the Inspector launcher, then AG-UI Events)", "Say hi in three words."],
      expect:
        "AG-UI Events fills with rows for agent `inspector`: RUN_STARTED, STATE_SNAPSHOT, TEXT_MESSAGE_*, MESSAGES_SNAPSHOT, RUN_FINISHED. Unchecking the box removes the launcher.",
      fail: "No launcher in the top-right corner, or AG-UI Events stays at “No events yet” during a run.",
    },
    sources: P("/inspector", BACKEND),
    notes: [
      {
        title: "Premium parts",
        tone: "warn",
        html: "Rich Threads shows a locked marketing view with “Copy setup prompt”. The sidebar shows “Intelligence is off”. Try from here, View in your app and Automatic Learning all need CopilotKit Intelligence, which is not configured. <b>Requires premium. Not testable locally.</b>",
      },
      {
        title: "AG-UI Events records only after the overlay is first opened",
        tone: "info",
        html: "If you send a message <i>before</i> opening the Inspector, Home lists the RUN_FINISHED under Recent activity, but AG-UI Events says “No events yet”. Open the pane first, then send, and every event is listed. The page's own wording (“see events arrive while the run is active”) fits this.",
      },
      {
        title: "Only React code on the page",
        tone: "info",
        html: "The page's single sample is React (<code>enableInspector={false}</code>). Its text gives the Vue form, <code>:enable-inspector=\"false\"</code>, which is what the checkbox drives. The “View in Inspector” message shortcut is described for React <code>CopilotChat</code> only and does not appear in the Vue chat. This demo ignores <code>VITE_COPILOTKIT_INSPECTOR</code>, because the overlay is the subject.",
      },
    ],
  },
];

export const threads: RouteMeta[] = [
  {
    path: "/prebuilt-components/copilot-threads-drawer",
    title: "Threads Drawer",
    docPath: "prebuilt-components/copilot-threads-drawer",
    summary:
      "The page's “App.vue with a toolbar button”: `CopilotThreadsDrawer` + `NewConversationButton` (`useCopilotChatConfiguration().startNewThread()`) + `CopilotChat`, inside one `CopilotChatConfigurationProvider`. It runs on the page's prescribed Intelligence runtime.",
    status: "broken",
    statusNote:
      "Requires premium, not testable locally. The runtime fails with “CopilotKitIntelligence `apiKey` is required and cannot be blank”. The chat errors with “Agent execution failed: … status 503”, and the drawer stays on “Loading threads…” with no locked view. Only New conversation (thread id changes) works.",
    hasDemo: true,
    agentId: "copilot-threads-drawer",
    runtimePath: "/api/copilotkit-section-a-threads",
    tryIt: {
      prompts: ["(click) New conversation", "Say hi in three words."],
      expect:
        "With Intelligence configured: the drawer lists the thread after the first run, and selecting a row replays it. Here: the thread id next to the button changes on every New conversation click; nothing else works.",
      fail: "Expected here: the drawer stays on “Loading threads…” and the message gets no reply (console: Runtime info request failed with status 503).",
    },
    sources: P(
      "/prebuilt-components/copilot-threads-drawer",
      "frontend/src/pages/prebuilt-components/copilot-threads-drawer/NewConversationButton.vue",
      THREADS_RUNTIME,
      BACKEND,
    ),
    notes: [
      threadsRuntimeNote,
      guardNote,
      {
        title: "No locked view, just endless loading",
        tone: "warn",
        html: "The page says that without a Threads license the drawer “shows a locked view in place of the list”. Observed instead: <code>New Conversation | Recent Conversations | Loading threads…</code>, unchanged after 25 s. That is because runtime info never loads. <code>public-license-key</code> reads <code>VITE_COPILOTKIT_PUBLIC_LICENSE_KEY</code> (unset) in place of the page's <code>\"ck_pub_...\"</code> placeholder.",
      },
      localThreadsNote,
    ],
  },
  {
    path: "/headless-threads",
    title: "Headless Threads",
    docPath: "headless-threads",
    summary:
      "The page's `ThreadSidebar.vue` (`useThreads` → `threads`, `isLoading`, `renameThread`, `archiveThread`, `deleteThread`, pagination with `limit` + `fetchMoreThreads`). Rows switch with `setActiveThreadId(id, { explicit: true })`. It sits beside `CopilotChat` in one configuration provider, on the page's Intelligence runtime.",
    status: "broken",
    statusNote:
      "Requires premium, not testable locally. The runtime fails with “CopilotKitIntelligence `apiKey` is required and cannot be blank”. useThreads stays on “Loading…” and the chat errors with “Agent execution failed: Runtime info request failed with status 503”.",
    hasDemo: true,
    agentId: "headless-threads",
    runtimePath: "/api/copilotkit-section-a-threads",
    tryIt: {
      prompts: ["Say hi in three words."],
      expect:
        "With Intelligence configured: a row appears in the useThreads list after the first run, and Rename/Archive/Delete act on it. Here: the list stays on “Loading…”.",
      fail: "Expected here: no reply, and the console shows status 503 with the CopilotKitIntelligence apiKey error.",
    },
    sources: P("/headless-threads", "frontend/src/pages/headless-threads/ThreadSidebar.vue", THREADS_RUNTIME, BACKEND),
    notes: [
      threadsRuntimeNote,
      guardNote,
      {
        title: "identifyUser is a static user",
        tone: "info",
        html: "The page's <code>verifyAppSession(request)</code> is your own auth. This harness has none, so <code>identifyUser</code> returns one fixed user. The lifecycle page says this is acceptable only for a single-user demo. In this harness the runtime never reaches it anyway.",
      },
      localThreadsNote,
    ],
  },
  {
    path: "/threads-lifecycle",
    title: "Thread & History Lifecycle",
    docPath: "threads-lifecycle",
    summary:
      "Mint → run → switch/start → hydrate, with the live `threadId` on screen. `ThreadControls.vue` (`setActiveThreadId(id, { explicit: true })`, `startNewThread()`) is joined by “mint up front” (`myApi.createThread()` → `setActiveThreadId`) and the page's `RestoreHistory.vue` (`agent.setMessages`). It runs on the default runtime. The “Scope Rich Threads to the signed-in user” runtime is the Intelligence endpoint.",
    status: "partial",
    statusNote:
      "Client lifecycle verified: auto-minted UUID, New chat clears, Open conversation replays the earlier thread (via the stock InMemoryAgentRunner's /connect), myApi id adoption, setMessages hydration. The Intelligence + identifyUser runtime fails with “CopilotKitIntelligence `apiKey` is required and cannot be blank” (premium).",
    hasDemo: true,
    agentId: "threads-lifecycle",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: [
        "My favourite colour is teal. Reply with OK.",
        "(click) New chat → (click) Open conversation",
        "What is my favourite colour?",
        "(click) New chat via myApi.createThread() → (tick) Hydrate manually",
      ],
      expect:
        "New chat shows a fresh UUID and an empty chat. Open conversation restores the previous UUID and replays the “teal” exchange, and the follow-up answer says teal. The myApi button sets an id that starts with `myapi-`. Ticking Hydrate shows the two “(restored)” messages.",
      fail: "Open conversation shows an empty chat (no replay), or the threadId does not change.",
    },
    sources: P(
      "/threads-lifecycle",
      "frontend/src/pages/threads-lifecycle/ThreadControls.vue",
      "frontend/src/pages/threads-lifecycle/RestoreHistory.vue",
      "frontend/src/pages/threads-lifecycle/myApi.ts",
      THREADS_RUNTIME,
      BACKEND,
    ),
    notes: [
      {
        title: "Replay comes from the stock in-memory runner",
        tone: "info",
        html: "The page says replay needs “a server-side store such as CopilotKit Intelligence or a persisting AgentRunner”, and that a runtime with no persistence layer “keeps nothing server-side”. The default <code>CopilotRuntime</code> already uses <code>InMemoryAgentRunner</code>, which keeps each thread's events in process memory. So <code>setActiveThreadId(id, { explicit: true })</code> → <code>POST …/connect</code> does replay, until the runtime process restarts.",
      },
      {
        title: "myApi is a stand-in (NOT DOC CODE)",
        tone: "info",
        html: "<code>myApi.createThread()</code> / <code>myApi.getMessages()</code> are the page's placeholders for your backend. <code>myApi.ts</code> mints <code>myapi-&lt;uuid&gt;</code> ids and returns a fixed two-message transcript labelled “(restored)”.",
      },
      { ...threadsRuntimeNote, title: "“Scope Rich Threads to the signed-in user” needs Intelligence" },
      guardNote,
    ],
  },
];
