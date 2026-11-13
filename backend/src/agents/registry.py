"""Every agent this server exposes, collected from `agents/routes/*.py`.

The key of each entry is both the AG-UI agent id the Vue app addresses and the
FastAPI path it is mounted at: `agentId: "tool-rendering"` on the frontend
resolves (through the Copilot Runtime) to `POST http://localhost:8000/tool-rendering`.

Each route module exports `AGENTS: dict[str, ClaudeAgentAdapter]` and may
export `register(app)` for extra HTTP endpoints (e.g. an MCP server).
"""

from __future__ import annotations

import importlib
import pkgutil
from collections.abc import Callable

from ag_ui_claude_sdk import ClaudeAgentAdapter
from fastapi import FastAPI

from agents import routes

REGISTRY: dict[str, ClaudeAgentAdapter] = {}
REGISTRARS: list[Callable[[FastAPI], None]] = []
SOURCES: dict[str, str] = {}

for _info in sorted(pkgutil.iter_modules(routes.__path__), key=lambda m: m.name):
    _module = importlib.import_module(f"agents.routes.{_info.name}")
    for _agent_id, _adapter in getattr(_module, "AGENTS", {}).items():
        if _agent_id in REGISTRY:
            raise RuntimeError(
                f"Agent id {_agent_id!r} registered twice "
                f"({SOURCES[_agent_id]} and {_info.name})"
            )
        REGISTRY[_agent_id] = _adapter
        SOURCES[_agent_id] = _info.name
    if callable(getattr(_module, "register", None)):
        REGISTRARS.append(_module.register)
