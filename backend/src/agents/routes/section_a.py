"""Basics, Custom Look and Feel, Threads — one adapter per doc route.

None of these pages define backend tools or agent-side behaviour: they are
about the Vue chat surfaces, slots, headless composables, programmatic runs,
the Inspector overlay and thread lifecycle. So every agent here is a plain
`ClaudeAgentAdapter` built the Quickstart way, with a prompt that keeps replies
short enough to read in a screen recording.

Agent ids are derived from the route paths and must stay globally unique.
"""

from agents.common import build_adapter

_SHORT = (
    "You are a helpful assistant embedded in a CopilotKit Vue demo. "
    "Keep every reply under 80 words unless the user asks for more."
)

# The Programmatic Control page's button sends "Summarize the latest sales
# data". The page never says where that data lives, so the agent is given a
# small fixed table in its prompt (repo-authored content, not doc code).
_SALES_PROMPT = (
    _SHORT
    + "\n\nThe latest sales data (Q3, by region, USD):\n"
    "- North America: 412,000 (up 8% on Q2)\n"
    "- Europe: 287,500 (down 3% on Q2)\n"
    "- APAC: 198,200 (up 21% on Q2)\n"
    "- LATAM: 64,900 (flat)\n"
    "When asked to summarize sales, use only this table and give the total."
)

# The Slots page's welcome button sends "Show my open tickets". Without data the
# model invents tool calls ("let me search your Drive"), so the agent gets a
# small fixed list (repo-authored content, not doc code).
_TICKETS_PROMPT = (
    _SHORT
    + "\n\nYou are a support assistant. You have no tools. The user's open tickets are:\n"
    "- #4812 Login page times out on Safari (high)\n"
    "- #4790 Export to CSV drops the last row (medium)\n"
    "- #4755 Typo on the billing settings page (low)\n"
    "Answer from this list only."
)

AGENTS = {
    "prebuilt-components": build_adapter("prebuilt-components", _SHORT),
    "custom-look-and-feel-slots": build_adapter("custom-look-and-feel-slots", _TICKETS_PROMPT),
    "custom-look-and-feel-headless-ui": build_adapter("custom-look-and-feel-headless-ui", _SHORT),
    "programmatic-control": build_adapter("programmatic-control", _SALES_PROMPT),
    "inspector": build_adapter("inspector", _SHORT),
    "copilot-threads-drawer": build_adapter("copilot-threads-drawer", _SHORT),
    "headless-threads": build_adapter("headless-threads", _SHORT),
    "threads-lifecycle": build_adapter("threads-lifecycle", _SHORT),
}
