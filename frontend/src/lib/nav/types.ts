/**
 * Shared types for the per-section nav files in this folder.
 *
 * Plain data, no Vue imports — `autorecorder/config/nav-check.ts` imports the
 * nav from Node.
 */

export const DOCS_ROOT = "https://docs.copilotkit.ai/vue/claude-sdk-python";

export type RouteStatus =
  | "working"
  | "partial"
  | "broken"
  | "reference"
  | "not-available"
  | "not-started";

export const STATUS_LABEL: Record<RouteStatus, string> = {
  working: "Working",
  partial: "Partial",
  broken: "Broken",
  reference: "Reference",
  "not-available": "Not available for Vue",
  "not-started": "Not started",
};

export const STATUS_EMOJI: Record<RouteStatus, string> = {
  working: "✅",
  partial: "⚠️",
  broken: "❌",
  reference: "📘",
  "not-available": "🚫",
  "not-started": "🚧",
};

export interface TryIt {
  prompts: string[];
  expect: string;
  fail?: string;
}

export interface RouteMeta {
  path: string;
  title: string;
  /** Path under DOCS_ROOT ("" for the root), or an absolute URL. */
  docPath: string;
  summary: string;
  status: RouteStatus;
  /** One line explaining the status — shown in the header and status table. */
  statusNote?: string;
  /** Page resolves on the docs site but is not in the Vue sidebar. */
  offNav?: boolean;
  /** The doc page only publishes React (or no Vue) frontend code. */
  reactOnlyDoc?: boolean;
  /** Owns a live surface at `<path>/demo-chat` (src/pages<path>/Demo.vue). */
  hasDemo?: boolean;
  /** Backend agent id (backend/src/agents/routes/*.py). */
  agentId?: string;
  /** Copilot Runtime base path the demo's provider points at. */
  runtimePath?: string;
  tryIt?: TryIt;
  /** Repo-relative files shown in the notes page's source panel. */
  sources?: string[];
  /** Extra notes, rendered as trusted HTML (repo-authored only). */
  notes?: { title: string; tone?: "info" | "warn" | "success"; html: string }[];
}

export interface NavGroup {
  title: string;
  routes: RouteMeta[];
}

/** Demo file first, then any extra repo-relative files. */
export const P = (route: string, ...files: string[]) => [
  `frontend/src/pages${route}/Demo.vue`,
  ...files,
];
