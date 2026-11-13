"""The Claude Agent SDK Python adapter, built the way the Quickstart builds it.

`ClaudeAgentAdapter` caches a worker (and its Claude CLI subprocess) per
thread, so it must be built once at module scope, never per request. This
harness needs one conversation per doc route, so it builds one adapter per
route — still at module scope, still one per process.

`build_adapter` lifts the values that vary between routes (name, prompt,
backend MCP servers, allowed tools) into arguments. Everything else — model,
empty `tools`, `dontAsk`, `max_turns` — is the same for every route.
"""

from __future__ import annotations

import dataclasses
import hashlib
import os
import tempfile
from pathlib import Path
from typing import Any

from ag_ui_claude_sdk import ClaudeAgentAdapter

DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6"
DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant embedded in a CopilotKit Vue app."

#: Prompts longer than this go to the CLI as a file (see FilePromptAdapter).
PROMPT_FILE_THRESHOLD = 8_000
_PROMPT_DIR = Path(tempfile.gettempdir()) / "cpk-vue-claude-sdk-py-prompts"


class FilePromptAdapter(ClaudeAgentAdapter):
    """NOT DOC CODE. The stock adapter, with long system prompts sent as a file.

    The adapter appends AG-UI state and CopilotKit context to the system prompt
    and the SDK passes it to the CLI as one `--system-prompt` argument. On
    Windows a command line is capped at ~32K chars; past that CreateProcess
    fails with WinError 206, which the SDK misreports as "Claude Code not
    found". `{"type": "file", "path": ...}` becomes `--system-prompt-file`.
    Short prompts are left untouched.
    """

    def build_options(self, *args, **kwargs):
        options = super().build_options(*args, **kwargs)
        prompt = options.system_prompt
        if isinstance(prompt, str) and len(prompt) > PROMPT_FILE_THRESHOLD:
            _PROMPT_DIR.mkdir(parents=True, exist_ok=True)
            digest = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
            path = _PROMPT_DIR / f"{digest}.md"
            if not path.exists():
                path.write_text(prompt, encoding="utf-8")
            options = dataclasses.replace(
                options, system_prompt={"type": "file", "path": str(path)}
            )
        return options


def build_adapter(
    name: str,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
    *,
    mcp_servers: dict[str, Any] | None = None,
    allowed_tools: list[str] | None = None,
    **extra_options: Any,
) -> ClaudeAgentAdapter:
    """One adapter, named and prompted for a single route.

    Frontend tools need no configuration: the adapter reads them off each run's
    `input_data.tools` and serves them from its own in-process `ag_ui` MCP
    server. Backend tools go in through `mcp_servers` (an in-process server
    from `create_sdk_mcp_server`) plus their `mcp__<server>__<tool>` names in
    `allowed_tools`, because `dontAsk` silently denies anything not listed.
    """
    options: dict[str, Any] = {
        # NOT DOC CODE. Without this, the bundled Claude Code CLI loads every
        # claude.ai connector the machine's login has (Gmail, Drive, Asana, …):
        # ~90 extra tools offered to a demo agent and ~65K extra prompt tokens
        # per run. A harness agent should only see the tools its doc page gives it.
        "env": {"ENABLE_CLAUDEAI_MCP_SERVERS": "false"},
        "model": os.getenv("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL),
        "system_prompt": system_prompt,
        "tools": [],
        "permission_mode": "dontAsk",
        "max_turns": 10,
        **extra_options,
    }
    if mcp_servers:
        options["mcp_servers"] = mcp_servers
    if allowed_tools:
        options["allowed_tools"] = allowed_tools
    # NOT DOC CODE. The adapter keeps one CLI subprocess (~130 MB) alive per
    # thread for 30 min by default. A harness opens a fresh thread on every demo
    # load, so idle CLIs pile up; 10 min keeps a conversation warm without that.
    return FilePromptAdapter(name=name, options=options, worker_ttl_seconds=600)
