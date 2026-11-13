/**
 * The lifecycle page's `myApi` is "your own backend". This harness has none, so
 * this in-browser stand-in mints ids and returns a fixed transcript. It is
 * repo-authored placeholder data, not doc code, and is labelled "(restored)"
 * wherever it appears so it can never be mistaken for agent output.
 */
export const myApi = {
  async createThread(): Promise<{ id: string }> {
    return { id: `myapi-${crypto.randomUUID()}` };
  },
  async getMessages(threadId: string) {
    return [
      { id: `${threadId}-u`, role: "user" as const, content: "(restored) What did we talk about last time?" },
      {
        id: `${threadId}-a`,
        role: "assistant" as const,
        content: "(restored) This history was loaded by RestoreHistory.vue with setMessages(), not replayed by the server.",
      },
    ];
  },
};
