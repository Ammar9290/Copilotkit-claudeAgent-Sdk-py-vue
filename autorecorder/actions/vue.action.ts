/**
 * Handlers for the Vue demos that need more than "type a prompt, wait".
 *
 * Every selector here was read off this repo's demo source
 * (`frontend/src/pages/**\/Demo.vue` and the components beside them) and was
 * exercised live when the page was built. Each handler checks for the *feature*,
 * not just for a reply.
 *
 * Broken and Partial pages (README §8) are not special-cased to pass. A Broken
 * page's handler checks for the real effect, so the run logs `[FAIL]` with the
 * reason and the video shows how the page behaves today. On a Partial page the
 * working half is checked hard, and the known-broken half is checked with
 * `softVisible`, which logs a warning.
 */

import { type Page } from 'playwright';
import { sendPrompt } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { awaitReply, clickOn, expectVisible, restOn, softVisible } from './helpers';

const waitOf = (c: PageRecordConfig): number => c.waitAfterPromptMs ?? 4000;
const ASSISTANT = '[data-testid="copilot-assistant-message"]';

/** Send `prompt`, then wait for `selector` (the feature) instead of a text reply. */
// 4 min: a cold Claude CLI start on a loaded machine can take over a minute
// before the model even begins (see backend/src/agent_server.py).
async function promptFor(page: Page, prompt: string, selector: string, why: string, timeoutMs = 240000) {
  await sendPrompt(page, prompt);
  const el = await expectVisible(page, selector, why, timeoutMs);
  await sleep(1500);
  await restOn(page, el, 2500);
  return el;
}

async function textOf(page: Page, selector: string): Promise<string> {
  return ((await page.locator(selector).first().textContent()) ?? '').trim();
}

// ── Basics / Custom look and feel ───────────────────────────────────────────

/** Prebuilt Components: reply + 👍 in CopilotChat, then the Sidebar and Popup tabs. */
export const runPrebuiltAction: PageActionHandler = async (page, config) => {
  const base = await sendPrompt(page, config.prompt);
  await awaitReply(page, waitOf(config), base);
  await clickOn(page, page.locator('button[aria-label="Good response"]').last(), '👍');
  await expectVisible(page, '[data-testid="chat-events"]:has-text("feedback")', 'Thumbs-up never reached the feedback handler', 10000);
  for (const tab of ['CopilotSidebar', 'CopilotPopup']) {
    await clickOn(page, page.locator(`[data-tab="${tab}"]`), tab);
    await sleep(1500);
    await clickOn(page, page.locator('.custom-launcher').last(), `${tab} launcher`);
    await sleep(2000);
  }
};

/** Slots: the custom welcome screen's button; replies carry the toolbar-items badge. */
export const runSlotsAction: PageActionHandler = async (page) => {
  await clickOn(page, page.locator('text=Show my open tickets'), '"Show my open tickets"');
  await expectVisible(page, '[data-testid="reviewed-badge"]', 'No reply carried the toolbar-items slot badge', 240000);
  await softVisible(page, '[data-testid="custom-user-message"]', 'user-message slot not rendered', 5000);
  await restOn(page, page.locator('[data-testid="reviewed-badge"]').last(), 2500);
};

/** Fully Headless UI: the page's own composer and bubbles. */
export const HEADLESS_INPUT = 'input[aria-label="Message"]';
export const runHeadlessUiAction: PageActionHandler = async (page, config) => {
  await sendPrompt(page, config.prompt, { inputSelector: HEADLESS_INPUT, messageSelector: '[data-testid="assistant-bubble"]' });
  await expectVisible(page, '[data-testid="assistant-bubble"] li', 'Headless view rendered no markdown reply', 240000);
  await restOn(page, page.locator('[data-testid="assistant-bubble"]').last(), 2500);
};

/** Programmatic Control: no composer — the button runs the agent, the subscriber logs. */
export const runProgrammaticAction: PageActionHandler = async (page) => {
  await clickOn(page, page.locator('[data-testid="run-agent"]'), '"Run agent"');
  await expectVisible(page, '[data-testid="event-log"]:has-text("done")', 'agent.subscribe never logged the run finishing', 240000);
  await restOn(page, page.locator('.programmatic-message[data-role="assistant"]').last(), 3000);
};

// ── Threads ─────────────────────────────────────────────────────────────────

/** Thread lifecycle: run, New chat mints an id, Open conversation replays the old one. */
export const runThreadsLifecycleAction: PageActionHandler = async (page, config) => {
  const base = await sendPrompt(page, config.prompt);
  await awaitReply(page, waitOf(config), base);
  const first = await textOf(page, '[data-testid="thread-id"]');
  await clickOn(page, page.locator('[data-testid="new-chat"]'), '"New chat"');
  await sleep(1500);
  if ((await textOf(page, '[data-testid="thread-id"]')) === first) throw new Error('New chat did not mint a new threadId');
  await clickOn(page, page.locator('[data-testid="open-conversation"]'), '"Open conversation"');
  await expectVisible(page, `${ASSISTANT}`, 'Replay restored no history', 30000);
  if ((await textOf(page, '[data-testid="thread-id"]')) !== first) throw new Error('Open conversation did not return to the first thread');
  await sleep(2500);
};

// ── Generative UI · Declarative ─────────────────────────────────────────────

const surface = (sel: string, why: string): PageActionHandler => async (page, config) => {
  await promptFor(page, config.prompt, sel, why);
};

export const runComponentsAction = surface('.a2ui-surface table', 'No standard-catalog table rendered');
export const runCatalogsAction = surface('[data-testid="product-card"]', 'Custom catalog ProductCard never rendered');
export const runStandardCatalogAction = surface('[data-testid="my-card"]', 'Card override (MyCard) never rendered');
export const runFromA2uiAction = surface('[data-testid="airport"]', 'Converted A2UI catalog component never rendered');
export const runMarkdownModeAction = surface('.a2ui-surface input[type=range]', 'Markdown-mode a2ui fence never rendered as a surface');
export const runA2uiAction = surface('.a2ui-surface', 'No A2UI surface rendered');
export const runA2uiDynamicAction = surface('.a2ui-surface', 'No A2UI surface rendered');
/** Broken in the nav: the flight catalog cannot be built in Vue, so this fails on purpose. */
export const runA2uiFixedAction = surface('.a2ui-surface', 'Fixed-schema flight card did not render (known: "Catalog not found: copilotkit://flight-fixed-catalog")');

/** Surfaces: render into the page's `featured` target, then hand it back. */
export const runSurfacesAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, '[data-testid="featured-section"] [data-testid="product-card"]', 'render_ui never filled the featured surface');
  const second = config.prompts?.[1];
  if (second) await promptFor(page, second, '[data-testid="product-row"]', 'deleteSurface did not bring the page row back');
};

/** State and actions: one product card, then "Add to cart" twice updates the page's store. */
export const runStateAndActionsAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, 'button:has-text("Add to cart")', 'No product card with an Add to cart action');
  for (let i = 0; i < 2; i++) {
    await clickOn(page, page.locator('button:has-text("Add to cart")').last(), '"Add to cart"');
    await sleep(800);
  }
  await expectVisible(page, '[data-testid="cart-count"]:has-text("2")', 'Surface action did not reach the cart store', 10000);
  await restOn(page, page.locator('[data-testid="cart-count"]'), 2000);
};

/** Theming: surface renders with the theme, then a live accent swap restyles it. */
export const runThemingAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, '.a2ui-surface', 'No themed surface rendered');
  await clickOn(page, page.locator('[data-accent="#7c3aed"]'), 'violet accent');
  await sleep(2500);
};

/** Transports: tool transport draws a slider. */
export const runTransportsAction: PageActionHandler = async (page, config) => {
  await clickOn(page, page.locator("button:text-is('tool')"), '"tool" transport');
  await promptFor(page, config.prompt, '.a2ui-surface input[type=range]', 'Tool transport drew no slider');
};

/** JSON Render / Hashbrown (Partial): the agent's spec arrives, but only as text. */
const specAsText = (needle: string): PageActionHandler => async (page, config) => {
  await promptFor(page, config.prompt, `${ASSISTANT}:has-text('${needle}')`, `Agent never emitted the ${needle} spec`);
};
export const runJsonRenderAction = specAsText('"root"');
export const runHashbrownAction = specAsText('"ui"');

// ── Generative UI · Open-ended and tools ────────────────────────────────────

export const runMcpAppsAction = surface(`${ASSISTANT} iframe, [data-testid="copilot-tool-render"] iframe, iframe`, 'MCP App iframe never mounted');
export const runOpenGenUiAction = surface('iframe.websandbox__frame', 'No sandboxed generated-UI iframe');
export const runToolBasedAction = surface('[data-testid="weather-card"]', 'useComponent WeatherCard never rendered');

/** Tool Rendering (Partial): the wildcard card renders; the per-tool card is the known gap. */
export const runToolRenderingAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, '[data-testid="copilot-tool-render"][data-status="complete"]', 'Backend tool call was never rendered');
  await softVisible(page, '[data-testid="weather-tool-card"]', 'WeatherToolCard absent — known: adapter keeps the mcp__weather__ prefix', 3000);
};

/** Frontend Tools: the browser-side handler re-filters the incident list. */
export const runFrontendToolsAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, '[data-testid="current-filter"]:has-text("sev1")', 'filter_incidents never ran in the browser');
};

// ── Shared state / HITL / Sub-agents ────────────────────────────────────────

/** Broken in the nav on this machine (raw Messages API, needs ANTHROPIC_API_KEY) — fails on the note. */
export const runSharedStateAction: PageActionHandler = async (page, config) => {
  await clickOn(page, page.locator('[data-testid="tone-concise"]'), '"concise" tone');
  await promptFor(page, config.prompt, '[data-testid="note"]', 'Agent never wrote a note into shared state', 60000);
};

export const runRenderingInAppAction: PageActionHandler = async (page, config) => {
  await clickOn(page, page.locator('[data-id="prototype"]'), 'canvas item');
  await promptFor(page, config.prompt, '[data-testid="canvas-title"]:has-text("Spring launch")', 'Canvas never re-rendered from agent state');
};

export const runAgentReadonlyAction: PageActionHandler = async (page, config) => {
  await page.locator('[data-testid="workspace-select"]').selectOption('aurora');
  await sleep(1000);
  await promptFor(page, config.prompt, `${ASSISTANT}:has-text("aurora")`, 'Agent did not see the read-only context value');
};

export const runHitlAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, '[data-testid="time-slot"]', 'Time picker never appeared');
  await clickOn(page, page.locator('[data-testid="time-slot"]').first(), 'first time slot');
  await expectVisible(page, '[data-testid="time-picked"]', 'Slot choice was not recorded', 10000);
  await sleep(8000);
};

export const runGovernedAction: PageActionHandler = async (page, config) => {
  await promptFor(page, config.prompt, '[data-testid="governed-approve"]', 'Approval card never appeared');
  await clickOn(page, page.locator('[data-testid="governed-approve"]').last(), '"Approve"');
  await expectVisible(page, '[data-testid="governed-submitted"]', 'Approval was not submitted', 10000);
  await sleep(8000);
};

/** Broken in the nav on this machine (raw Messages API, needs ANTHROPIC_API_KEY) — fails on the log. */
export const runSubagentsAction = surface('[data-testid="delegation-entry"]', 'No delegation recorded');

// ── Built-in agent / Runtime ────────────────────────────────────────────────

/** Built-in Agent (Partial): registration is visible; the model call needs a key. */
export const runBuiltInAgentAction: PageActionHandler = async (page, config) => {
  await expectVisible(page, '[data-testid="bia-info"]', 'BuiltInAgent not listed by /info', 15000);
  await sendPrompt(page, config.prompt);
  await softVisible(page, `${ASSISTANT}`, 'No reply — known: BuiltInAgent needs ANTHROPIC_API_KEY in the runtime env', 20000);
};

export const runRuntimeEndpointsAction: PageActionHandler = async (page) => {
  await clickOn(page, page.locator('[data-testid="run-run"]'), '"run"');
  await expectVisible(page, '[data-testid="probe-run"] [data-event-type="RUN_FINISHED"]', 'POST …/run never finished', 240000);
  for (const id of ['run-connect', 'run-messages', 'run-threads', 'run-single-info']) {
    await clickOn(page, page.locator(`[data-testid="${id}"]`), id);
    await sleep(1200);
  }
};

export const runCustomAgentAction = surface(`${ASSISTANT}:has-text("72")`, 'Custom factory weather tool never answered');

export const runAgentRunnerAction: PageActionHandler = async (page, config) => {
  const base = await sendPrompt(page, config.prompt);
  await awaitReply(page, waitOf(config), base);
  await clickOn(page, page.locator('[data-testid="remount"]'), '"Remount"');
  await expectVisible(page, 'text=PELICAN-42', 'Runner did not replay the thread after remount', 30000);
  await clickOn(page, page.locator('[data-testid="read-store"]'), '"Read store"');
  await expectVisible(page, '[data-testid="store-status"]:has-text("200")', 'Thread store read failed', 15000);
};

export const runAgUiAction = surface('[data-callback="onToolCallResultEvent"]', 'agent.subscribe never saw a tool result');

export const runAuthAction: PageActionHandler = async (page, config) => {
  const base = await sendPrompt(page, config.prompt);
  await awaitReply(page, waitOf(config), base);
  await clickOn(page, page.locator('[data-testid="token-bob"]'), 'Bob\'s token');
  await clickOn(page, page.locator('[data-testid="probe-messages"]'), 'read Alice\'s thread');
  await expectVisible(page, '[data-testid="probe-status"]:has-text("403")', 'Another user could read the thread', 15000);
};

// ── Pages added later: state rendering / streaming ──────────────────────────

/**
 * State Rendering (Broken in the nav): the page's raw Messages API backend needs
 * ANTHROPIC_API_KEY, and its component reads keys the backend never writes. The
 * feature is the progress panel leaving "Idle".
 */
export const runStateRenderingAction = surface(
  '[data-testid="research-status"]:not(:has-text("Idle"))',
  'Agent state never reached the progress panel (known: raw Messages API backend needs ANTHROPIC_API_KEY)',
);

/** State Streaming (Broken in the nav): the draft should grow as tool args stream. */
export const runStateStreamingAction = surface(
  '[data-testid="document-text"]:not(:has-text("Waiting for a draft"))',
  'No document streamed into shared state (known: raw Messages API backend needs ANTHROPIC_API_KEY)',
);
