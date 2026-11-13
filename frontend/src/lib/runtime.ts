/**
 * Where the browser reaches the Copilot Runtime.
 *
 * Doc samples use relative `runtime-url="/api/copilotkit…"` paths; Vite's dev
 * proxy forwards those to the runtime process (vite.config.ts). The Quickstart
 * alone publishes the absolute cross-origin URL, so it uses this origin.
 */
export const RUNTIME_ORIGIN = import.meta.env.VITE_RUNTIME_ORIGIN ?? "http://localhost:8300";

/**
 * Inspector is on by default in dev builds (the Inspector page's own advice).
 * `VITE_COPILOTKIT_INSPECTOR=off` turns it off app-wide, e.g. for recordings.
 */
export const INSPECTOR_ENABLED = import.meta.env.VITE_COPILOTKIT_INSPECTOR !== "off";
