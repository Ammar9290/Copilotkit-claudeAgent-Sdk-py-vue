/**
 * The nav, the route headers, the notes pages, the status table and the
 * autorecorder's nav check all read from here, so each doc page and its
 * implementation status are described in one place.
 *
 * Paths match the doc URLs under docs.copilotkit.ai/vue/claude-sdk-python.
 * Each section's entries live in `./nav/section-*.ts`; this file only puts
 * them in the order the doc sidebar uses.
 *
 * This is plain data with no Vue imports, because the autorecorder imports it from Node.
 */
import { DOCS_ROOT, P, type NavGroup, type RouteMeta } from "./nav/types";
import { basics, customLook, threads } from "./nav/section-a";
import { declarativeComponents } from "./nav/section-b";
import { declarativeOther } from "./nav/section-c";
import { appControl, openEnded, toolUi } from "./nav/section-d";
import { hitl, sharedState, subagents } from "./nav/section-e";
import { builtInAgent, runtime } from "./nav/section-f";

export * from "./nav/types";

const gettingStarted: RouteMeta[] = [
  {
    path: "/",
    title: "Introduction",
    docPath: "",
    summary: "What this harness covers and how its three processes fit together.",
    status: "reference",
  },
  {
    path: "/quickstart",
    title: "Quickstart",
    docPath: "quickstart",
    summary:
      "A Vite + Vue app, a standalone Copilot Runtime on its own port with `cors: true`, and `CopilotChat` under `CopilotKitProvider`. It is wired to a Claude Agent SDK (Python) agent instead of the page's BuiltInAgent.",
    status: "working",
    hasDemo: true,
    agentId: "default",
    runtimePath: "/api/copilotkit",
    tryIt: {
      prompts: ["Tell me in one sentence what this app can do.", "Can you tell me a joke?"],
      expect: "Tokens stream into the chat and the reply renders as markdown.",
      fail: "A red error toast or no reply. Check the connection panel below; it names which process is down.",
    },
    sources: P(
      "/quickstart",
      "frontend/src/main.ts",
      "frontend/server.ts",
      "frontend/runtime/endpoints/default.ts",
      "frontend/runtime/agents.ts",
      "backend/src/agent_server.py",
      "backend/src/agents/common.py",
      "backend/src/agents/routes/quickstart.py",
    ),
    notes: [
      {
        title: "Doc's BuiltInAgent replaced with the Claude Agent SDK (Python)",
        tone: "info",
        html: "The Vue Quickstart registers <code>new BuiltInAgent({ model: \"openai:gpt-6-luna\" })</code> as <code>default</code>, and its own callout says that if you already have an agent you should wire it in instead. So here <code>default</code> is an <code>HttpAgent</code> pointed at the Python <code>ClaudeAgentAdapter</code> on :8100, and <code>&lt;CopilotChat /&gt;</code> picks it up with no <code>agent-id</code>, the same way the page's sample does.",
      },
    ],
  },
];

/** In the order the Vue doc sidebar lists them. */
export const NAV: NavGroup[] = [
  { title: "Getting Started", routes: gettingStarted },
  { title: "Basics", routes: basics },
  { title: "Custom Look and Feel", routes: customLook },
  { title: "Threads", routes: threads },
  { title: "Generative UI · Declarative", routes: [...declarativeComponents, ...declarativeOther] },
  { title: "Generative UI · Open-Ended", routes: openEnded },
  { title: "Generative UI · Tools", routes: toolUi },
  { title: "App Control", routes: appControl },
  { title: "Shared State", routes: sharedState },
  { title: "Human In The Loop", routes: hitl },
  { title: "Built-in Agent", routes: builtInAgent },
  { title: "Runtime", routes: runtime },
  { title: "Multi-Agent", routes: subagents },
];

export const ALL_ROUTES: RouteMeta[] = NAV.flatMap((g) => g.routes);

export function findRoute(path: string): RouteMeta | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}

export function docUrl(route: RouteMeta): string {
  if (/^https?:\/\//.test(route.docPath)) return route.docPath;
  return route.docPath ? `${DOCS_ROOT}/${route.docPath}` : DOCS_ROOT;
}

export function demoPath(route: RouteMeta): string | undefined {
  return route.hasDemo ? `${route.path}/demo-chat` : undefined;
}
