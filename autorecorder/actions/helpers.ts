/**
 * Shared building blocks for the handlers in this directory.
 *
 * `core/actions.ts` covers "type a prompt, wait for the reply". Almost every
 * page in this repo needs a little more than that: click a suggestion chip,
 * wait for a generated chart, prove a frontend tool actually changed the page.
 * Those steps were being re-implemented per handler, each with its own idea of
 * how long to wait and whether a miss is fatal. They live here instead, so the
 * rules are the same everywhere:
 *
 *   - `expectVisible` is for the thing the page exists to show. A miss throws,
 *     so a page whose feature is broken FAILS instead of producing a calm video
 *     of nothing happening.
 *   - `softVisible` is for supporting evidence that depends on model choices
 *     (whether it emitted reasoning, whether a thread list is enabled). A miss
 *     logs and continues.
 *
 * Nothing here knows about a specific page. Selectors come from the caller or
 * from `config/selectors.config.ts`. Like `page-ready.ts`, this is a candidate
 * for promotion into `core/` once other framework repos want it.
 */

import { type Locator, type Page } from 'playwright';
import { SELECTORS } from '../config/selectors.config';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import {
  getAssistantMessageCount,
  sendPrompt,
  waitForAgentResponseCompletion,
} from '../core/actions';

/** Height of the simulated taskbar drawn by `core/overlays/taskbar.ts`. */
export const TASKBAR_PX = 48;

/** Viewport the engine records at. */
const VIEWPORT_H = 1080;

/**
 * Glides the virtual cursor to an element and clicks it.
 *
 * Elements whose centre falls under the taskbar overlay cannot receive a real
 * mouse click: the overlay swallows it, and a mousedown on a non-focusable div
 * also blurs whatever was focused. For those the cursor still travels there for
 * the camera, but the click is dispatched on the element itself.
 */
export async function clickOn(
  page: Page,
  target: Locator,
  label: string,
  opts: { timeoutMs?: number } = {},
): Promise<void> {
  const el = target.first();
  await el.waitFor({ state: 'visible', timeout: opts.timeoutMs ?? 10000 });
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();

  if (!box) {
    await el.click();
    return;
  }

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await humanGlide(page, cx, cy, 20);
  await sleep(250);

  if (cy > VIEWPORT_H - TASKBAR_PX) {
    await el.evaluate((node) => (node as HTMLElement).click());
  } else {
    await humanClick(page);
  }
  console.log(`   🖱️  clicked ${label}`);
}

/** Moves the cursor onto an element and holds it there for the viewer. */
export async function restOn(
  page: Page,
  target: Locator,
  ms = 2000,
): Promise<boolean> {
  const el = target.first();
  if (!(await el.isVisible().catch(() => false))) return false;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox().catch(() => null);
  if (!box) return false;
  await humanGlide(
    page,
    box.x + Math.min(box.width / 2, 260),
    box.y + Math.min(box.height / 2, 120),
    22,
  );
  await sleep(ms);
  return true;
}

/**
 * Waits for the evidence a page exists to produce. Throws with `why` when it
 * never appears -- that message is what ends up in the run summary.
 */
export async function expectVisible(
  page: Page,
  selector: string,
  why: string,
  timeoutMs = 60000,
): Promise<Locator> {
  const el = page.locator(selector).last();
  try {
    await el.waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`${why} (waited ${Math.round(timeoutMs / 1000)}s for ${selector})`);
  }
  return el;
}

/** Like `expectVisible`, but a miss only logs. */
export async function softVisible(
  page: Page,
  selector: string,
  note: string,
  timeoutMs = 15000,
): Promise<Locator | null> {
  const el = page.locator(selector).last();
  const ok = await el
    .waitFor({ state: 'visible', timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
  if (!ok) {
    console.warn(`   ⚠️ ${note}`);
    return null;
  }
  return el;
}

/** Number of elements matching `selector` right now. */
export async function countOf(page: Page, selector: string): Promise<number> {
  return page.locator(selector).count().catch(() => 0);
}

/**
 * Waits until `selector` matches more elements than `before`. Throws with `why`
 * on timeout. Used where "it rendered" must mean "a NEW one rendered" -- pages
 * that already show the same kind of element before the agent acts.
 */
export async function expectMoreThan(
  page: Page,
  selector: string,
  before: number,
  why: string,
  timeoutMs = 90000,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if ((await countOf(page, selector)) > before) return;
    await sleep(400);
  }
  throw new Error(`${why} (no new ${selector} within ${Math.round(timeoutMs / 1000)}s)`);
}

/**
 * Clicks a CopilotKit suggestion chip by its visible title and returns the
 * assistant-message baseline from before the click, ready for
 * `waitForAgentResponseCompletion`.
 */
export async function clickSuggestion(
  page: Page,
  title: string,
): Promise<number> {
  const chip = page.locator(`[data-testid="copilot-suggestion"]:has-text("${title}")`);
  await chip.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {
    throw new Error(
      `Suggestion chip "${title}" never appeared -- useConfigureSuggestions did not ` +
        'register, or the chat never mounted.',
    );
  });
  const before = await getAssistantMessageCount(page);
  await clickOn(page, chip, `suggestion "${title}"`);
  return before;
}

/**
 * Throws if a CopilotKit error banner or a generative-UI render error is on
 * screen. Call after a run on pages where an error would otherwise be masked
 * by a reply that still arrived.
 */
export async function assertNoRenderError(page: Page, context: string): Promise<void> {
  const err = page.locator('[data-generative-ui-error]').first();
  if (await err.isVisible().catch(() => false)) {
    const id = await err.getAttribute('data-generative-ui-error').catch(() => '');
    throw new Error(`${context}: generative UI reported a render error (component "${id}")`);
  }
}

/**
 * Waits until a new assistant message has visible text, up to `timeoutMs`.
 *
 * `waitForAgentResponseCompletion` in core gives the first token a fixed 30s.
 * That is too short here, measured: a turn that starts with a tool call
 * (change_background, set_notes, render_ui) produces no assistant *text* until
 * the tool round trip finishes, and a long first answer from a cold agent
 * routinely needs 35-60s. Both failed runs that then passed on a retry.
 * Waiting here first means core's detector starts on a reply that already
 * exists. Same condition as core: a message beyond the baseline whose
 * textContent is non-trivial.
 *
 * @returns Whether a reply started. Never throws -- core reports the failure.
 */
export async function waitForReplyStart(
  page: Page,
  baseline: number,
  messageSelector: string = SELECTORS.assistantMessage,
  timeoutMs = 90000,
): Promise<boolean> {
  return page
    .waitForFunction(
      ({ sel, base }) => {
        const msgs = document.querySelectorAll(sel);
        if (base > 0 && msgs.length <= base) return false;
        for (let i = msgs.length - 1; i >= 0; i--) {
          if ((msgs[i].textContent || '').trim().length > 2) return true;
        }
        return false;
      },
      { sel: messageSelector, base: baseline },
      { timeout: timeoutMs, polling: 400 },
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * The shared detector with a realistic first-token window. Use this instead of
 * calling `waitForAgentResponseCompletion` directly.
 */
export async function awaitReply(
  page: Page,
  waitMs: number,
  baseline: number,
  messageSelector?: string,
): Promise<void> {
  await waitForReplyStart(page, baseline, messageSelector);
  await waitForAgentResponseCompletion(page, waitMs, baseline, messageSelector);
}

/**
 * Waits out the rest of a turn whose real evidence has already been checked.
 *
 * Generative-UI turns can end with a component and no prose, and the shared
 * detector reads "no assistant text" as "the agent never answered". Once the
 * handler has already proven the component rendered, that verdict is wrong,
 * so here it is downgraded to a note and the reading pause still happens.
 */
export async function finishTurn(
  page: Page,
  waitMs: number,
  baseline: number,
  messageSelector?: string,
): Promise<void> {
  try {
    await awaitReply(page, waitMs, baseline, messageSelector);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.startsWith('Agent never produced a response')) throw e;
    console.log('   (no trailing prose after the rendered component -- expected here)');
    await sleep(waitMs);
  }
}

/** Sends a chat prompt and waits for the full reply. Returns the baseline. */
export async function ask(
  page: Page,
  prompt: string,
  waitMs = 4000,
): Promise<number> {
  const base = await sendPrompt(page, prompt, { timeoutMs: 15000 });
  await awaitReply(page, waitMs, base);
  return base;
}

/**
 * Default for pages with no specialised handler: type the prompt, wait for
 * the reply. Same as core's `runStandardAction`, but with `awaitReply`'s
 * first-token window.
 */
export const runPromptAction = async (
  page: Page,
  config: { prompt: string; waitAfterPromptMs?: number },
): Promise<void> => {
  await ask(page, config.prompt, config.waitAfterPromptMs ?? 4000);
};

/** Selector for the default chat composer, re-exported for handlers. */
export const CHAT_INPUT = SELECTORS.chatInput;
