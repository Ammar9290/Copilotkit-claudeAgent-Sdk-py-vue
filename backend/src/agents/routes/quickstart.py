"""Getting started — the Quickstart's single agent.

The Vue Quickstart's runtime registers an agent named `default`, which is the
id `<CopilotChat />` picks up when no `agent-id` is passed. Here `default` is a
Claude Agent SDK Python adapter instead of the Quickstart's `BuiltInAgent`.
"""

from agents.common import build_adapter

AGENTS = {
    "default": build_adapter("default"),
}
