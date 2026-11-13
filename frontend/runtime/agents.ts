/**
 * Helpers every runtime endpoint uses to reach the Claude Agent SDK Python
 * backend.
 *
 * The backend mounts one AG-UI endpoint per agent id (`POST /<agentId>`). The
 * runtime binds each with the generic `HttpAgent` from `@ag-ui/client` — the
 * Python adapter speaks plain AG-UI over SSE, so there is no
 * framework-specific wrapper to import.
 */
import { HttpAgent } from "@ag-ui/client";

export const AGENT_URL = (process.env.AGENT_URL ?? "http://localhost:8100").replace(/\/$/, "");

/** One HttpAgent pointed at `POST {AGENT_URL}/{agentId}`. */
export function claudeAgent(agentId: string): HttpAgent {
  return new HttpAgent({ url: `${AGENT_URL}/${agentId}` });
}

/** Bind several backend agent ids at once: `{ id: HttpAgent }`. */
export function claudeAgents(ids: string[]): Record<string, HttpAgent> {
  return Object.fromEntries(ids.map((id) => [id, claudeAgent(id)]));
}

/** Ask the backend which agents it mounted (`GET /health`). */
export async function backendAgentIds(): Promise<string[]> {
  const res = await fetch(`${AGENT_URL}/health`);
  if (!res.ok) throw new Error(`Agent server /health returned ${res.status}`);
  const body = (await res.json()) as { agents: string[] };
  return body.agents;
}
