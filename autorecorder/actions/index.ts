/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS DIRECTORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * What the recorder does on each Vue demo once it is open. A page with no
 * entry falls back to `runPromptAction` (helpers.ts) — type the prompt, submit,
 * wait for the reply. That is right only where the reply itself is the feature
 * (Quickstart, Inspector, Copilot Runtime). Everywhere else a handler in
 * `vue.action.ts` checks that the page's feature actually worked.
 */

import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runPromptAction } from './helpers';
import { hideDevChrome, liftAboveTaskbar, waitForPageReady, type ReadyOptions } from './page-ready';
import * as A from './vue.action';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  'prebuilt-components': A.runPrebuiltAction,
  'custom-look-and-feel-slots': A.runSlotsAction,
  'custom-look-and-feel-headless-ui': A.runHeadlessUiAction,
  'programmatic-control': A.runProgrammaticAction,

  'threads-lifecycle': A.runThreadsLifecycleAction,

  'generative-ui-components': A.runComponentsAction,
  'generative-ui-components-surfaces': A.runSurfacesAction,
  'generative-ui-components-catalogs': A.runCatalogsAction,
  'generative-ui-components-standard-catalog': A.runStandardCatalogAction,
  'generative-ui-components-state-and-actions': A.runStateAndActionsAction,
  'generative-ui-components-theming': A.runThemingAction,
  'generative-ui-components-transports': A.runTransportsAction,
  'generative-ui-components-markdown-mode': A.runMarkdownModeAction,
  'generative-ui-components-from-a2ui': A.runFromA2uiAction,
  'generative-ui-a2ui': A.runA2uiAction,
  'generative-ui-a2ui-fixed-schema': A.runA2uiFixedAction,
  'generative-ui-a2ui-dynamic-schema': A.runA2uiDynamicAction,
  'generative-ui-json-render': A.runJsonRenderAction,
  'generative-ui-hashbrown': A.runHashbrownAction,

  'generative-ui-mcp-apps': A.runMcpAppsAction,
  'generative-ui-open-generative-ui': A.runOpenGenUiAction,
  'generative-ui-state-rendering': A.runStateRenderingAction,
  'generative-ui-tool-rendering': A.runToolRenderingAction,
  'generative-ui-tool-based': A.runToolBasedAction,
  'frontend-tools': A.runFrontendToolsAction,

  'shared-state': A.runSharedStateAction,
  'shared-state-rendering-in-app': A.runRenderingInAppAction,
  'shared-state-streaming': A.runStateStreamingAction,
  'shared-state-agent-readonly': A.runAgentReadonlyAction,
  'human-in-the-loop': A.runHitlAction,
  'human-in-the-loop-governed-actions': A.runGovernedAction,
  'multi-agent-subagents': A.runSubagentsAction,

  'built-in-agent': A.runBuiltInAgentAction,
  'backend-runtime-endpoints': A.runRuntimeEndpointsAction,
  'backend-custom-agent': A.runCustomAgentAction,
  'backend-agent-runner': A.runAgentRunnerAction,
  'backend-ag-ui': A.runAgUiAction,
  auth: A.runAuthAction,
};

/**
 * Per-page overrides for the readiness gate.
 *
 * `warmPaths`: demos whose provider points at a runtime base path other than
 * `/api/copilotkit` (frontend/runtime/endpoints/) warm that one instead. The
 * Intelligence-gated threads endpoint answers 503 by design; warming tolerates it.
 * `inputSelector`: demos with no CopilotKit composer on first paint.
 */
const warm = (base: string) => ({ warmPaths: [`${base}/info`] });

export const READY_OPTIONS: Record<string, Partial<ReadyOptions>> = {
  'prebuilt-components-copilot-threads-drawer': warm('/api/copilotkit-section-a-threads'),
  'headless-threads': warm('/api/copilotkit-section-a-threads'),
  'generative-ui-components-transports': warm('/api/copilotkit-section-b-transports'),
  'generative-ui-a2ui': warm('/api/copilotkit-section-c-a2ui'),
  'generative-ui-a2ui-fixed-schema': warm('/api/copilotkit-section-c-a2ui-fixed'),
  'generative-ui-mcp-apps': warm('/api/copilotkit-section-d-mcp-apps'),
  'generative-ui-open-generative-ui': warm('/api/copilotkit-section-d-ogui'),
  'shared-state': warm('/api/copilotkit-section-e'),
  'multi-agent-subagents': warm('/api/copilotkit-section-e'),
  'built-in-agent': warm('/api/copilotkit-section-f-bia'),
  'backend-copilot-runtime': warm('/api/copilotkit-section-f-runtime'),
  'backend-custom-agent': warm('/api/copilotkit-section-f-router'),
  'backend-agent-runner': warm('/api/copilotkit-section-f-runner'),
  auth: { warmPaths: [] },
  // These two agents are reached directly (/agent/…), not through a runtime base path.
  'generative-ui-state-rendering': { warmPaths: [] },
  'shared-state-streaming': { warmPaths: [] },
  'custom-look-and-feel-slots': { inputSelector: 'text=Show my open tickets' },
  'custom-look-and-feel-headless-ui': { inputSelector: A.HEADLESS_INPUT },
  'programmatic-control': { inputSelector: '[data-testid="run-agent"]' },
  'backend-runtime-endpoints': { inputSelector: '[data-testid="run-run"]', warmPaths: [] },
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
): Promise<void> {
  await liftAboveTaskbar(page);
  await hideDevChrome(page);
  await waitForPageReady(page, { label: config.id, ...READY_OPTIONS[config.id] });
  await liftAboveTaskbar(page);
  await hideDevChrome(page);

  const handler = ACTION_MAP[config.id] ?? runPromptAction;
  await handler(page, config, rootPath);
}
