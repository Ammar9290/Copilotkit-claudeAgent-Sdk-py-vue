/**
 * `openGenUiSandboxFunctions` from the Open Generative UI page's "Advanced:
 * With app tool calling" section (its `sandbox-functions` module), unchanged
 * apart from these comments. The page only publishes React for the provider,
 * but this array is framework-neutral and the Vue provider's
 * `openGenerativeUI.sandboxFunctions` takes the same shape.
 *
 * Inside the generated iframe the agent's JS calls
 * `await Websandbox.connection.remote.<name>(args)`; the handler runs here, on
 * the host page.
 */
import { z } from "zod";

export const openGenUiSandboxFunctions = [
  {
    name: "evaluateExpression",
    description:
      "Safely evaluate a basic arithmetic expression on the host page and return the numeric result. " +
      "Supports +, -, *, /, parentheses, and decimal numbers. " +
      "Use this from inside a calculator or spreadsheet UI.",
    parameters: z.object({
      expression: z.string().describe("An arithmetic expression, e.g. '12 * (3 + 4.5)'"),
    }),
    handler: async ({ expression }: { expression: string }) => {
      // Evaluate only arithmetic-safe expressions. Reject anything with
      // identifiers or suspicious characters so we never exec arbitrary JS.
      if (!/^[\d+\-*/().\s]+$/.test(expression)) {
        return { ok: false, error: "Unsupported characters in expression." };
      }
      try {
        // eslint-disable-next-line no-new-func
        const value = Function(`"use strict"; return (${expression});`)();
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return { ok: false, error: "Not a finite number." };
        }
        // eslint-disable-next-line no-console
        console.log("[open-gen-ui/advanced] evaluateExpression", expression, "=", value);
        return { ok: true, value };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  },
  {
    name: "notifyHost",
    description:
      "Send a short notification message from the sandboxed UI to the host page. " +
      "The host logs the message and returns a confirmation object.",
    parameters: z.object({
      message: z.string().describe("A short status message."),
    }),
    handler: async ({ message }: { message: string }) => {
      // eslint-disable-next-line no-console
      console.log("[open-gen-ui/advanced] notifyHost:", message);
      return { ok: true, receivedAt: new Date().toISOString(), message };
    },
  },
];
