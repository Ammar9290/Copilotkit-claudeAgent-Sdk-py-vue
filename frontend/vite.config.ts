import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

/**
 * Vite serves the Vue app on :5273. The Copilot Runtime is a separate Node
 * process (frontend/server.ts, :8300). That is the Vue Quickstart's shape,
 * moved off the Quickstart's 5173/8200 so this harness can run next to the
 * sibling harnesses.
 *
 * The browser reaches the runtime in two ways, both taken from the docs:
 *   - the Quickstart demo uses the absolute cross-origin URL, which needs `cors: true`
 *     on the runtime, as that page shows;
 *   - every other page uses a relative `runtime-url="/api/copilotkit…"`, as their
 *     samples show, and this proxy forwards it to the same runtime.
 *
 * `/agent` goes straight to the Python agent server, for pages that connect
 * to an AG-UI agent without the runtime.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const runtime = env.VITE_RUNTIME_ORIGIN || "http://localhost:8300";
  const agent = env.VITE_AGENT_ORIGIN || "http://localhost:8100";

  const port = Number(env.VITE_PORT || 5273);

  return {
    // One dependency-optimizer cache per port, so several dev servers on this
    // checkout (e.g. a recording run beside a dev session) don't overwrite each
    // other's pre-bundled deps and serve 504 "Outdated Optimize Dep" errors.
    cacheDir: `node_modules/.vite-${port}`,
    plugins: [vue(), tailwindcss()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: {
      port,
      strictPort: true,
      // The source panels read files from backend/ too.
      fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
      proxy: {
        "/api": { target: runtime, changeOrigin: true },
        "/harness": { target: runtime, changeOrigin: true },
        "/agent": {
          target: agent,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/agent/, ""),
        },
      },
    },
  };
});
