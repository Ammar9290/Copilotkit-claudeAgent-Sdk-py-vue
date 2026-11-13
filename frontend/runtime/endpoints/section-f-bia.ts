/**
 * Built-in Agent: `/api/copilotkit-section-f-bia`.
 *
 * The Vue page is a one-paragraph summary: `BuiltInAgent({ model, tools,
 * prompt })` instantiated inside the runtime, running the agent loop
 * in-process, with no agent server behind it. That is exactly what this file
 * builds — note it does NOT import `../agents`: the Python backend is not
 * involved at all.
 *
 * The model string is resolved by the AI SDK provider inside this Node
 * process, so it needs ANTHROPIC_API_KEY in the runtime's environment. The
 * harness has none (the Python agents authenticate through the Claude Code CLI
 * login, which the AI SDK cannot use), so the run is expected to fail at the
 * model call. That failure is kept as-is.
 */
import { BuiltInAgent, CopilotRuntime, defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";

// A server-side tool, so the `tools` field the page names is exercised too.
const getServerTime = defineTool({
  name: "getServerTime",
  description: "Return the current time on the runtime server for an IANA timezone.",
  parameters: z.object({ timezone: z.string().describe("e.g. Europe/Berlin") }),
  execute: async ({ timezone }) => ({
    timezone,
    time: new Date().toLocaleString("en-GB", { timeZone: timezone }),
  }),
});

const agent = new BuiltInAgent({
  model: "anthropic/claude-sonnet-4-6",
  prompt: "You are a concise assistant running inside the Copilot Runtime. Answer in under 50 words.",
  tools: [getServerTime],
});

export default {
  basePath: "/api/copilotkit-section-f-bia",
  runtime: new CopilotRuntime({
    agents: { default: agent },
  }),
};
