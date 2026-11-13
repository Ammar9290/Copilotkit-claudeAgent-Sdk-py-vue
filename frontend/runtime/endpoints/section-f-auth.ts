/**
 * Authentication: `/api/copilotkit-section-f-auth`.
 *
 * The page's backend is `createCopilotRuntimeHandler({ runtime, basePath,
 * hooks })`. This harness mounts endpoints with `createCopilotNodeListener`,
 * which takes the same `hooks` option, so the hooks are passed through
 * server.ts's `options`.
 *
 *   - `onRequest`: the page's Bearer check, verbatim, plus the 401 it throws.
 *   - `onBeforeHandler`: "Scope threads yourself › Enforce it in
 *     onBeforeHandler", verbatim.
 *
 * The page leaves `verifyJwt`, `verifyRequest` and `userOwnsThread` to you.
 * They are filled in below with the smallest stand-ins (NOT DOC CODE): two
 * fixed demo tokens instead of real JWTs, and an in-memory Map instead of the
 * page's `thread_owners` table. A thread is recorded for its user the first
 * time that user runs on it — the page's "write a row when a conversation is
 * first created".
 */
import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime, InMemoryAgentRunner } from "@copilotkit/runtime/v2";

import { AGENT_URL, claudeAgent } from "../agents";

// ── NOT DOC CODE: stand-ins for "your validation" ──────────────────────────
const DEMO_TOKENS: Record<string, { id: string; name: string }> = {
  "alice-token": { id: "alice", name: "Alice" },
  "bob-token": { id: "bob", name: "Bob" },
};

/** Like a real JWT verifier, an invalid token throws (here: the 401 itself). */
function verifyJwt(token: string) {
  const user = DEMO_TOKENS[token];
  if (!user) {
    throw new Response(JSON.stringify({ error: "invalid token" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}

async function verifyRequest(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  return verifyJwt(authHeader.slice("Bearer ".length));
}

/** The page's `thread_owners` table, as a Map. */
const threadOwners = new Map<string, string>();

async function userOwnsThread(userId: string, threadId: string) {
  const owner = threadOwners.get(threadId);
  if (owner === undefined) {
    threadOwners.set(threadId, userId); // first use mints the row
    return true;
  }
  return owner === userId;
}
// ───────────────────────────────────────────────────────────────────────────

const runtime = new CopilotRuntime({
  agents: {
    default: claudeAgent("section-f-auth"),
    // Debug endpoint (see section_f.py): shows the Authorization header that
    // the runtime forwarded to the agent server.
    "header-echo": new HttpAgent({ url: `${AGENT_URL}/section-f-header-echo` }),
  },
  runner: new InMemoryAgentRunner(),
});

const hooks = {
  onRequest: ({ request }: { request: Request }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    const token = authHeader.slice("Bearer ".length);
    const user = verifyJwt(token); // your validation
    // attach user to request-scoped context here
    void user;
  },

  onBeforeHandler: async ({ request, route }: { request: Request; route: { method: string; threadId?: string } }) => {
    const user = await verifyRequest(request);

    // Routes that name a thread directly.
    if ("threadId" in route && route.threadId) {
      if (!(await userOwnsThread(user.id, route.threadId))) {
        throw new Response("Forbidden", { status: 403 });
      }
      return;
    }

    // agent/run and agent/connect carry the thread in the body instead.
    if (route.method === "agent/run" || route.method === "agent/connect") {
      // Clone: the handler still needs to read the original body.
      const { threadId } = await request.clone().json();
      if (threadId && !(await userOwnsThread(user.id, threadId))) {
        throw new Response("Forbidden", { status: 403 });
      }
    }
  },
};

export default {
  basePath: "/api/copilotkit-section-f-auth",
  runtime,
  options: { hooks },
};
