/** Worker B — Generative UI › Declarative › Components and surfaces.
 *
 * Each entry is one doc route. Edit only this file for this section. */
import { P, type RouteMeta } from "./types";

const BACKEND = "backend/src/agents/routes/section_b.py";
const SHARED = "frontend/src/pages/generative-ui/components/_shared";

/** The same adapter behaviour shows up on every page here, so the note is shared. */
const RENDER_UI_HALT_NOTE = {
  title: "Known adapter issue: render_ui halts the run, and the next turn replays it",
  tone: "warn" as const,
  html:
    "<code>render_ui</code> is added by the runtime as a client tool, so <code>ClaudeAgentAdapter</code> treats it like a frontend tool: the run stops right after the call (<code>TOOL_CALL_RESULT</code> then <code>RUN_FINISHED</code>), and the surface is already rendered by then. " +
    "On the <em>next</em> user turn the adapter first hands the model that pending tool result. Two things follow, both seen live: " +
    "(1) the reply sometimes starts with text about the previous request (for example \"The plan comparison table was fully rendered… Could you clarify what you'd like to continue with?\") before it handles the new one; " +
    "(2) when the model makes two <code>render_ui</code> calls in one turn, the run ends with <code>RUN_ERROR: Claude SDK cannot resume multiple pending tool calls. The original pending batch is retained; SDK batch recovery is unsupported.</code> " +
    "Whatever rendered before the error stays on screen. The duplicate-ID warning <code>CopilotChatMessageView: Deduplicated 1 message(s) with duplicate IDs.</code> also shows on follow-up turns. Left as is (no workaround).",
};

const PROMPT_NOTE = {
  title: "Doc's TanStack BuiltInAgent replaced with the Claude Agent SDK (Python)",
  tone: "info" as const,
  html:
    "Step 2 of the page builds a <code>BuiltInAgent</code> (TanStack AI + OpenAI) and says any agent works as long as it passes the run's <code>tools</code> and context to its model. " +
    "<code>ClaudeAgentAdapter</code> does both: run tools become its in-process <code>ag_ui</code> MCP server, and context entries are appended to the system prompt (long prompts go to the CLI as a file, see <code>FilePromptAdapter</code>). " +
    "So the agents here are plain adapters with the page's system prompt, verbatim: <em>\"You are a helpful assistant. When a visual answer helps, render it with generative UI.\"</em> The runtime is the shared <code>/api/copilotkit</code> with no <code>generativeUI</code> option, which is the page's \"Left out\" case.",
};

const PRODUCTS_NOTE = {
  title: "NOT DOC CODE: the get_products backend tool",
  tone: "info" as const,
  html:
    "ProductCard's description says <em>\"Copy every value from a product of a tool result\"</em>, but no page publishes that tool. <code>section_b.py</code> adds a small Python <code>get_products</code> tool (in-process MCP server + <code>mcp__shop__get_products</code> in <code>allowed_tools</code>), and serves the product images at <code>/agent/section-b/products/&lt;id&gt;.svg</code>. The chat shows the call as <code>mcp__shop__get_products</code>.",
};

export const declarativeComponents: RouteMeta[] = [
  {
    path: "/generative-ui/components",
    title: "Components and surfaces",
    docPath: "generative-ui/components",
    summary:
      "The Vue tab of \"Try it\": `:generativeUI=\"{ ui: standardUI }\"` on `CopilotKitProvider`, the chart and map plugins in `main.ts`, and a plain `CopilotChat`. The runtime adds a `render_ui` tool and a guide to any run that carries a catalog, and the agent draws standard-catalog components in the chat.",
    status: "partial",
    statusNote:
      "The page's prompt renders a real standard-catalog Table in the chat. The follow-up that should change it in place is unreliable: the next turn starts with the replayed render_ui result, and two render_ui calls in one turn end in RUN_ERROR \"Claude SDK cannot resume multiple pending tool calls\".",
    hasDemo: true,
    agentId: "gen-ui-components",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Compare the Starter, Team, and Enterprise plans in a table", "add a column for support"],
      expect:
        "A real table (not markdown) streams into the chat, built from standard Table / TableRow / TableCell components. The follow-up updates that same surface.",
      fail:
        "A markdown table means `render_ui` was never offered (check the `:generativeUI` binding is camelCase). On the follow-up, see the adapter note below.",
    },
    sources: P(
      "/generative-ui/components",
      "frontend/src/main.ts",
      "frontend/runtime/endpoints/default.ts",
      BACKEND,
      "backend/src/agents/common.py",
    ),
    notes: [
      PROMPT_NOTE,
      {
        title: "Charts and maps",
        tone: "info",
        html: "The page's second <code>main.ts</code> registers <code>GenerativeUIChart</code> and <code>GenerativeUIMap</code> app-wide. This harness's <code>src/main.ts</code> already does that, so the demo needs nothing more.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/surfaces",
    title: "Surfaces",
    docPath: "generative-ui/components/surfaces",
    summary:
      "A shop home page with a page target, `<GenerativeUISurface id=\"featured\">` (description, `components` limit, and the existing row as the default-slot fallback). It also has a per-item `recommendations-<id>` target and the provider's `errorBoundary` with the page's `RetryFallback`. The chat in the sidebar changes the page.",
    status: "working",
    statusNote:
      "Verified live: the agent renders a ProductGrid into the `featured` target (not the chat). \"Show the featured products again\" sends `deleteSurface`, and the page's own row comes back. A per-product target also fills. The error-boundary fallback was not triggered.",
    hasDemo: true,
    agentId: "gen-ui-components-surfaces",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: [
        "Show me cheap running shoes in the featured row",
        "Show the featured products again",
        "What would you recommend with the Mechanical Keyboard?",
      ],
      expect:
        "The dashed placeholder row under FEATURED PRODUCTS is replaced by product cards. The second prompt deletes the surface and the placeholder row returns. The third fills the \"You might also like\" area.",
      fail: "The cards show up in the chat instead of in the page.",
    },
    sources: P(
      "/generative-ui/components/surfaces",
      "frontend/src/pages/generative-ui/components/surfaces/FeaturedProducts.vue",
      "frontend/src/pages/generative-ui/components/surfaces/RetryFallback.vue",
      "frontend/src/pages/generative-ui/components/surfaces/ProductRow.vue",
      `${SHARED}/shop-ui.ts`,
      `${SHARED}/products.ts`,
      BACKEND,
    ),
    notes: [
      PRODUCTS_NOTE,
      {
        title: "What was observed",
        tone: "success",
        html:
          "The run's envelope lists three targets: <code>chat</code>, <code>featured</code> (with the page's description and <code>components: [\"ProductGrid\",\"ProductCard\"]</code>) and <code>recommendations-kb-01</code>. The model answered with <code>render_ui</code> to <code>target: \"featured\"</code> and a <code>ProductGrid</code> root. A later turn sent <code>{\"deleteSurface\":{\"surfaceId\":…}}</code> and the slot fallback reappeared.",
      },
      {
        title: "Not exercised",
        tone: "info",
        html: "<code>errorBoundary.fallback</code> (RetryFallback) and <code>onError</code> are wired as on the page, but no component failed during testing, so the fallback was never seen. <code>autoScroll</code> keeps its default.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/catalogs",
    title: "Catalogs",
    docPath: "generative-ui/components/catalogs",
    summary:
      "The page's `acme/shop@1` catalog: `createGenerativeUI` with ProductGrid (a `children` slot) and ProductCard as Vue SFCs, given to the provider. The JSON from `exportA2UICatalog(shopUI, { title: \"Acme shop\" })` is shown next to the chat.",
    status: "working",
    statusNote:
      "Verified live: the agent calls get_products, then renders our own Vue ProductGrid with ProductCards in the chat. The exported catalog renders beside it. The page's `exportA2UICatalog(shopUI, …)` call does not typecheck in @copilotkit/vue 1.87.0 (TS2345); it is widened with `as never`.",
    hasDemo: true,
    agentId: "gen-ui-components-catalogs",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show me the products of the shop"],
      expect: "A ProductGrid of our ProductCard components (coloured image, name, $price) renders in the chat.",
      fail: "Standard-catalog cards or plain text instead of the custom components.",
    },
    sources: P(
      "/generative-ui/components/catalogs",
      `${SHARED}/shop-ui.ts`,
      `${SHARED}/ProductGrid.vue`,
      `${SHARED}/ProductCard.vue`,
      BACKEND,
    ),
    notes: [
      PRODUCTS_NOTE,
      {
        title: "Type error in the page's exportA2UICatalog call",
        tone: "warn",
        html:
          "<code>exportA2UICatalog(shopUI, { title: \"Acme shop\" })</code>, as the Vue tab writes it, fails vue-tsc: <code>TS2345: Argument of type 'GenerativeUI&lt;GenerativeUIResultDefinitions&lt;…&gt;&gt;' is not assignable to parameter of type 'GenerativeUI&lt;GenerativeUIDefinitions, GenerativeUIAnyComponent&gt;'</code>. The argument is cast with <code>as never</code> only so the shared typecheck passes. At runtime the call works and returns the catalog JSON.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/standard-catalog",
    title: "Standard Catalog",
    docPath: "generative-ui/components/standard-catalog",
    summary:
      "One `appUI` that combines two of the page's samples. It drops components with `extends: [standardUI.omit([\"Map\", \"Video\", \"HtmlView\"])]` and swaps the standard Card for the page's `MyCard.vue` (`child` + `children` named slots) with `overrides: { Card: { component: MyCard } }`.",
    status: "working",
    statusNote:
      "Verified live: a weather card renders through MyCard (rounded-2xl, shadow, \"MyCard\" tag). Asked for a map, the agent did not use the omitted Map component.",
    hasDemo: true,
    agentId: "gen-ui-components-standard-catalog",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show a card summarizing today's weather in Paris with a short list of tips.", "Now show Paris on a map"],
      expect:
        "The card's outer box is MyCard: a small \"MyCard\" tag sits in its top-right corner. The second prompt gets no interactive map, because Map was omitted.",
      fail: "The default Card styling with no MyCard tag means the override did not apply.",
    },
    sources: P(
      "/generative-ui/components/standard-catalog",
      "frontend/src/pages/generative-ui/components/standard-catalog/MyCard.vue",
    ),
    notes: [
      {
        title: "Two samples in one catalog",
        tone: "info",
        html: "The page says <code>omit</code> and <code>overrides</code> can be combined, so the demo uses both in one <code>createGenerativeUI</code>. The \"MyCard\" tag in MyCard.vue is ours, added so a recording shows which component rendered.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/state-and-actions",
    title: "State and actions",
    docPath: "generative-ui/components/state-and-actions",
    summary:
      "The page's `acme/shop@1` with `state: { cart }` and a `bind.inCart` selector (`useGenerativeUIState`). It also has an `addToCart` function behind `events.onAddToCart` (`useGenerativeUIFunction`), a `CheckoutForm` with `writable: [\"email\"]` (`defineModel`), and an event with no matching function (`onChoose`) that sends a click to the agent.",
    status: "partial",
    statusNote:
      "Single components work: one ProductCard with Add to cart updates the page's cart and the bound \"in cart\" count. CheckoutForm keeps typed text over an agent update. PlanButton's click becomes a user message. Two cards fail: the page's catalog has no layout component, so the model's first try is rejected (`unknown component \"Box\"`). The retry hits RUN_ERROR \"Claude SDK cannot resume multiple pending tool calls\".",
    hasDemo: true,
    agentId: "gen-ui-components-state-and-actions",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: [
        "Show me the Mechanical Keyboard as a product card.",
        "Show me a checkout form, prefilled with the email jane@example.com bound to /checkout/email in the data model.",
        "Give me a button to pick the Team plan.",
      ],
      expect:
        "Clicking Add to cart raises the Cart counter in the top bar and the card's \"in cart: N\", with no agent message. Text typed into the form's Email field stays after you ask the agent to change it. The plan button posts \"I'd like to choose the Team plan.\" as a user message and the agent replies.",
      fail: "No Add to cart button (event not bound) or the cart stays at 0. For two cards at once, see the status note.",
    },
    sources: P(
      "/generative-ui/components/state-and-actions",
      "frontend/src/pages/generative-ui/components/state-and-actions/shop-ui.ts",
      "frontend/src/pages/generative-ui/components/state-and-actions/Bindings.vue",
      "frontend/src/pages/generative-ui/components/state-and-actions/ProductCard.vue",
      "frontend/src/pages/generative-ui/components/state-and-actions/CheckoutForm.vue",
      "frontend/src/pages/generative-ui/components/state-and-actions/PlanButton.vue",
      "frontend/src/pages/generative-ui/components/state-and-actions/cart-store.ts",
      BACKEND,
    ),
    notes: [
      {
        title: "Observed failure: two product cards",
        tone: "warn",
        html:
          "The page's catalog has only its own components (no <code>extends: [standardUI]</code>). Asked for \"the keyboard and the mouse as product cards\", the model wrapped them in a <code>Box</code>. The runtime returned <code>{\"status\":\"rendered\",\"applied\":0,\"rejected\":[{\"index\":0,\"reason\":\"component \\\"root\\\": unknown component \\\"Box\\\"\"},{\"index\":1,\"reason\":\"surface \\\"product-cards-1\\\" does not exist; send createSurface first\"},…]}</code>, and nothing rendered. " +
          "On the next turn the model made two single-card surfaces, and the run ended with <code>RUN_ERROR: Claude SDK cannot resume multiple pending tool calls…</code>. Kept as the page wrote it: no layout component was added to the catalog.",
      },
      {
        title: "Merged snippets and NOT DOC CODE parts",
        tone: "info",
        html:
          "The page shows the catalog as one snippet per section. <code>shop-ui.ts</code> merges them into one catalog. <code>useCartStore</code> is imported on the page but never published, so <code>cart-store.ts</code> is a small reactive stand-in. The \"Send a click to the agent\" section shows only the <code>onChoose</code> event, so the <code>PlanButton</code> that fires it is ours. The agent does not see the cart state; the page says to add <code>useAgentContext</code> for that, which this demo does not do.",
      },
      PRODUCTS_NOTE,
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/theming",
    title: "Theming",
    docPath: "generative-ui/components/theming",
    summary:
      "The Vue tab's `theme` (`--a2ui-color-accent`, `--a2ui-font-family`, `--a2ui-radius-md`) plus \"Colors for each mode\" (`dark: { … }`). The theme lives in a `ref` so the accent buttons restyle live surfaces, and the page's index.html dark-mode script runs for the demo's lifetime.",
    status: "working",
    statusNote:
      "Verified live: generated surfaces get `--a2ui-color-accent: #d97706`, `--a2ui-radius-md: 10px` and `--a2ui-font-family: Inter`. Changing the ref restyles them, and in dark mode `--a2ui-color-surface`/`--a2ui-color-panel` switch to the `dark` values.",
    hasDemo: true,
    agentId: "gen-ui-components-theming",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show a form to sign up for our newsletter with a submit button."],
      expect:
        "The form's button uses the amber accent. Clicking the purple or green dot in the top bar recolours it at once, and \"mode · switch\" flips the surface to the dark colours.",
      fail: "The default accent, or no change when you click a dot.",
    },
    sources: P("/generative-ui/components/theming"),
    notes: [
      {
        title: "Dark class and the harness chrome",
        tone: "info",
        html: "The demo toggles <code>.dark</code> on <code>&lt;html&gt;</code>, as the page's script does, and restores it on unmount. The standard components follow that class. The harness's own header may not, because its Tailwind <code>dark:</code> variant is not tied to the class.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/transports",
    title: "Transports",
    docPath: "generative-ui/components/transports",
    summary:
      "The page's three Vue provider samples behind a switch: tool transport (default), `transport: 'markdown'`, and `agentIds: ['shop']` (\"Only some agents\"). They run against their own runtime endpoint built as the page's `new CopilotRuntime({ agents, generativeUI: true })`.",
    status: "working",
    statusNote:
      "Verified live in all three modes. Tool: a render_ui call draws a Slider. Markdown: the reply holds an a2ui fence that renders as a Slider surface, with no render_ui tool. agentIds ['shop']: this agent gets no catalog and answers in plain text.",
    hasDemo: true,
    agentId: "gen-ui-components-transports",
    runtimePath: "/api/copilotkit-section-b-transports",
    tryIt: {
      prompts: ["Show a slider to pick a number of seats from 1 to 50."],
      expect:
        "tool and markdown: a real slider renders in the chat (one via a render_ui tool call, one inline in the text reply). other-agent-only: a text or code-block answer, with no generated UI.",
      fail: "Raw JSON or a fenced a2ui code block in tool/markdown mode.",
    },
    sources: P("/generative-ui/components/transports", "frontend/runtime/endpoints/section-b-transports.ts", BACKEND),
    notes: [
      {
        title: "What each mode sent",
        tone: "success",
        html:
          "tool: <code>copilotkit_transport: \"tool\"</code>, and the SSE shows <code>TOOL_CALL_START(render_ui)</code> + <code>ACTIVITY_SNAPSHOT</code>. markdown: <code>copilotkit_transport: \"markdown\"</code>, <code>copilotkit_contextSent: true</code>, two context entries (markdown guide ~13.8K chars, component schema ~38K chars), and the SSE has only TEXT_MESSAGE events. agentIds ['shop']: a 378-byte request with no <code>forwardedProps.copilotkit.ui</code>.",
      },
      {
        title: "Runtime option",
        tone: "info",
        html: "<code>generativeUI: true</code> is the page's runtime sample. A run with a markdown envelope still gets no <code>render_ui</code>, and a run with no envelope (the <code>agentIds</code> mode) passes through unchanged.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
  {
    path: "/generative-ui/components/markdown-mode",
    title: "Markdown Mode",
    docPath: "generative-ui/components/markdown-mode",
    summary:
      "`transport: 'markdown'`: the agent writes the UI in ```a2ui fences in its reply. Two modes: \"Turn it on\" (the provider sends the schema and guide as context), and \"Build your own prompt\" (`sendContext: false`, with the backend reading `forwardedProps.copilotkit.ui` using the page's Python lines).",
    status: "working",
    statusNote:
      "Verified live in both modes: prose, then an interactive surface (Slider and more) inline in the reply, then more prose. No render_ui tool call. With sendContext: false the request carries no context and the backend builds the prompt from the envelope.",
    hasDemo: true,
    agentId: "gen-ui-components-markdown-mode",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Give me a plan estimator with a seats slider."],
      expect: "Text, then a live slider surface in the same reply, then more text. Moving the slider updates the bound values.",
      fail: "The ```a2ui block prints as a code block.",
    },
    sources: P("/generative-ui/components/markdown-mode", BACKEND),
    notes: [
      {
        title: "Build your own prompt: where the page's Python goes",
        tone: "info",
        html:
          "The page gives three Python lines (<code>ui = input.forwarded_props[\"copilotkit\"][\"ui\"]</code> …) but not where they run in a Claude Agent SDK backend. <code>OwnPromptAdapter</code> in <code>section_b.py</code> (NOT DOC CODE) runs them in <code>build_options</code>, the adapter's per-run hook, and passes the result as the system prompt. The agent id is <code>gen-ui-components-markdown-mode-own-prompt</code>. The adapter logs <code>Ignoring non-whitelisted forwarded_prop: copilotkit</code>, but <code>input_data.forwarded_props</code> still holds the envelope.",
      },
    ],
  },
  {
    path: "/generative-ui/components/from-a2ui",
    title: "Adopt from A2UI",
    docPath: "generative-ui/components/from-a2ui",
    summary:
      "The page's Vue \"After\": `:generativeUI=\"{ ui: appUI }\"` with the converted `acme/flights@1` catalog (`extends: [standardUI]`, Airport with plain `z.string()` props, Arrow). Nothing A2UI-specific is set on the runtime.",
    status: "working",
    statusNote: "Verified live: the agent renders two Airport components and an Arrow from the converted catalog.",
    hasDemo: true,
    agentId: "gen-ui-components-from-a2ui",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Show the route from SFO to JFK with the airports and an arrow."],
      expect: "Two Airport boxes (SFO / San Francisco, JFK / New York) with an orange → between them render in the chat.",
      fail: "Text only, which means the custom components were not offered to the agent.",
    },
    sources: P(
      "/generative-ui/components/from-a2ui",
      "frontend/src/pages/generative-ui/components/from-a2ui/app-ui.ts",
      "frontend/src/pages/generative-ui/components/from-a2ui/Airport.vue",
      "frontend/src/pages/generative-ui/components/from-a2ui/Arrow.vue",
    ),
    notes: [
      {
        title: "Only the \"After\" is built",
        tone: "info",
        html: "The Vue tab says <code>@copilotkit/vue</code> has no function that builds a custom v0.9 catalog, so there is no \"Before\" catalog to convert. The <code>:a2ui=\"{ catalog: vueBasicCatalog }\"</code> \"Before\" provider is covered by the A2UI pages. Airport.vue and Arrow.vue markup is ours; the page publishes only the catalog entries.",
      },
      RENDER_UI_HALT_NOTE,
    ],
  },
];
