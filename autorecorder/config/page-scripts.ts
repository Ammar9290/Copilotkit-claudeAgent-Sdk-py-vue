/**
 * What the recorder types on each demo — the hand-maintained half of
 * pages.config.ts (the other half is derived from the nav by
 * generate-pages.ts). Keys are page ids: the route path with `/` → `-`.
 *
 * Each prompt is one that was verified live when the page was built and that
 * makes the page's feature show, not just a reply. A page with no entry here
 * uses its nav entry's first `tryIt` prompt.
 */
export interface PageScript {
  prompt?: string;
  prompts?: string[];
  waitAfterPromptMs?: number;
}

export const PAGE_SCRIPTS: Record<string, PageScript> = {
  quickstart: { prompt: "Tell me in one sentence what this app can do." },
  "prebuilt-components": { prompt: "Write me a haiku about Vue." },
  "custom-look-and-feel-headless-ui": { prompt: "Give me a two-item markdown list of fruits." },
  inspector: { prompt: "Say hi in three words." },
  "prebuilt-components-copilot-threads-drawer": { prompt: "Say hi in three words." },
  "headless-threads": { prompt: "Say hi in three words." },
  "threads-lifecycle": { prompt: "My favourite colour is teal. Reply with OK." },

  "generative-ui-components": { prompt: "Compare the Starter, Team, and Enterprise plans in a table" },
  "generative-ui-components-surfaces": {
    prompt: "Show me cheap running shoes in the featured row",
    prompts: ["Show me cheap running shoes in the featured row", "Show the featured products again"],
  },
  "generative-ui-components-catalogs": { prompt: "Show me the products of the shop" },
  "generative-ui-components-standard-catalog": { prompt: "Show a card summarizing today's weather in Paris with a short list of tips." },
  "generative-ui-components-state-and-actions": { prompt: "Show me the Mechanical Keyboard as a product card." },
  "generative-ui-components-theming": { prompt: "Show a form to sign up for our newsletter with a submit button." },
  "generative-ui-components-transports": { prompt: "Show a slider to pick a number of seats from 1 to 50." },
  "generative-ui-components-markdown-mode": { prompt: "Give me a plan estimator with a seats slider." },
  "generative-ui-components-from-a2ui": { prompt: "Show the route from SFO to JFK with the airports and an arrow." },
  "generative-ui-a2ui": { prompt: "Build a contact form with name, email and a submit button." },
  "generative-ui-a2ui-fixed-schema": { prompt: "Show me a United flight from SFO to JFK for $289." },
  "generative-ui-a2ui-dynamic-schema": { prompt: "Build a contact form with name, email and a submit button." },
  "generative-ui-json-render": { prompt: "Show me the sales dashboard with metrics and a revenue chart" },
  "generative-ui-hashbrown": { prompt: "Show me a Q4 sales dashboard" },

  "generative-ui-mcp-apps": { prompt: "Draw a simple flowchart on the whiteboard: Idea → Build → Ship." },
  "generative-ui-open-generative-ui": { prompt: "Build me a simple greeting card." },
  "generative-ui-state-rendering": { prompt: "Draft a one-paragraph product brief for a habit-tracking app." },
  "generative-ui-tool-rendering": { prompt: "What's the weather in Tokyo?" },
  "generative-ui-tool-based": { prompt: "Show me the weather in Lisbon." },
  "frontend-tools": { prompt: "Show me only sev1 incidents." },

  "shared-state": { prompt: "Please remember that my favourite colour is teal." },
  "shared-state-rendering-in-app": { prompt: "Rename the project to 'Spring launch' and add an item 'Write launch blog post'." },
  "shared-state-streaming": { prompt: "Write a three-paragraph essay about why lighthouses matter." },
  "shared-state-agent-readonly": { prompt: "Which workspace am I in?" },
  "human-in-the-loop": { prompt: "Book an intro call about the Q3 roadmap with Alice from Sales." },
  "human-in-the-loop-governed-actions": { prompt: "Send an email to bob@example.com saying the launch moved to Friday." },
  "multi-agent-subagents": { prompt: "Write a short paragraph about why the Wright brothers' first flight mattered." },

  "built-in-agent": { prompt: "What time is it in Tokyo?" },
  "backend-copilot-runtime": { prompt: "Reply with exactly: pong" },
  "backend-custom-agent": { prompt: "What's the weather in San Francisco?" },
  "backend-agent-runner": { prompt: "Remember the codeword PELICAN-42 and confirm it in one line." },
  "backend-ag-ui": { prompt: "Roll 3 dice please" },
  auth: { prompt: "Reply with exactly: authorized" },
};
