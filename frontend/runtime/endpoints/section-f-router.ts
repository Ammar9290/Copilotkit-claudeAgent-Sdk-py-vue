/**
 * Use any model router (BuiltInAgent factory mode): `/api/copilotkit-section-f-router`.
 *
 * Every factory below is the page's code, one agent per tab/example, each
 * registered under its own key (the page registers each as `default`, one at a
 * time). The models are the page's: `openai("gpt-6-luna")`,
 * `openaiText("gpt-6-luna")`, `anthropic("claude-sonnet-4-6")`, and the
 * Custom tab's placeholder `https://your-llm-api.com/chat`.
 *
 * No OPENAI_API_KEY / ANTHROPIC_API_KEY is available to this Node process, so
 * the AI SDK and TanStack agents are expected to fail at the model call, and
 * the Custom tab's fetch goes to a placeholder host. Only `custom-tools` (the
 * "With Tools › Custom" example, which yields fixed AG-UI events and calls no
 * model) can run to completion. None of that is papered over.
 */
import {
  BuiltInAgent,
  convertInputToTanStackAI,
  convertMessagesToVercelAISDKMessages,
  convertToolsToVercelAITools,
  CopilotRuntime,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { EventType, type BaseEvent } from "@ag-ui/client";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { chat } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { streamText } from "ai";

// Quick Start › AI SDK (+ "With Tools › AI SDK": frontend tools converted).
const aisdk = new BuiltInAgent({
  type: "aisdk",
  factory: ({ input, abortSignal }) => {
    const tools = convertToolsToVercelAITools(input.tools);
    return streamText({
      model: openai("gpt-6-luna"),
      messages: convertMessagesToVercelAISDKMessages(input.messages),
      // @ts-expect-error -- doc code, kept verbatim: the runtime's ToolSet comes from
      // the `ai` copy nested under @copilotkit/runtime, not the app's ai@7, and tsc
      // rejects the mix ("Property '[schemaSymbol]' is missing"). Runs anyway.
      tools,
      abortSignal,
    });
  },
});

// Quick Start › TanStack AI.
const tanstack = new BuiltInAgent({
  type: "tanstack",
  factory: ({ input, abortController }) => {
    const { messages, systemPrompts } = convertInputToTanStackAI(input);
    // @ts-expect-error -- doc code, kept verbatim: the installed @tanstack/ai `chat()`
    // types require a `threadId` the page's sample does not pass.
    return chat({
      adapter: openaiText("gpt-6-luna"),
      messages,
      systemPrompts,
      abortController,
    });
  },
});

// Quick Start › Custom.
const custom = new BuiltInAgent({
  type: "custom",
  factory: async function* ({ input, abortSignal }) {
    const response = await fetch("https://your-llm-api.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: input.messages }),
      signal: abortSignal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const messageId = crypto.randomUUID();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield {
        type: EventType.TEXT_MESSAGE_CHUNK,
        role: "assistant",
        messageId,
        delta: decoder.decode(value),
      } as BaseEvent;
    }
  },
});

// Examples › With Tools › Custom: yields AG-UI events directly, no model call.
const customTools = new BuiltInAgent({
  type: "custom",
  factory: async function* ({ input: _input }) {
    const messageId = crypto.randomUUID();
    const toolCallId = crypto.randomUUID();

    // The LLM decides to call a tool
    yield {
      type: EventType.TOOL_CALL_START,
      parentMessageId: messageId,
      toolCallId,
      toolCallName: "getWeather",
    } as BaseEvent;

    yield {
      type: EventType.TOOL_CALL_ARGS,
      toolCallId,
      delta: JSON.stringify({ city: "San Francisco" }),
    } as BaseEvent;

    yield {
      type: EventType.TOOL_CALL_END,
      toolCallId,
    } as BaseEvent;

    // Execute the tool and return the result
    yield {
      type: EventType.TOOL_CALL_RESULT,
      role: "tool",
      messageId: crypto.randomUUID(),
      toolCallId,
      content: JSON.stringify({ temp: 72, city: "San Francisco" }),
    } as BaseEvent;

    // Text response after the tool call
    yield {
      type: EventType.TEXT_MESSAGE_CHUNK,
      role: "assistant",
      messageId,
      delta: "The weather in San Francisco is 72°F.",
    } as BaseEvent;
  },
});

// Examples › With Reasoning › AI SDK (Anthropic thinking model).
const reasoning = new BuiltInAgent({
  type: "aisdk",
  factory: ({ input, abortSignal }) =>
    streamText({
      model: anthropic("claude-sonnet-4-6"),
      providerOptions: {
        anthropic: {
          thinking: { type: "adaptive" },
          effort: "high",
        },
      },
      messages: convertMessagesToVercelAISDKMessages(input.messages),
      abortSignal,
    }),
});

export default {
  basePath: "/api/copilotkit-section-f-router",
  runtime: new CopilotRuntime({
    agents: {
      aisdk,
      tanstack,
      custom,
      "custom-tools": customTools,
      "aisdk-reasoning": reasoning,
    },
    runner: new InMemoryAgentRunner(),
  }),
};
