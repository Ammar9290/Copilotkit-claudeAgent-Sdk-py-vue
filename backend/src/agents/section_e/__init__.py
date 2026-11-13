"""Worker E — backend code published on the Shared State and Sub-Agents pages.

Both pages publish a Python backend that does NOT use `ClaudeAgentAdapter`:
it is a hand-rolled loop over the raw Anthropic Messages API
(`anthropic.AsyncAnthropic`). The published code lives here as printed; the
pieces the pages never publish (the run loop around the fragments, message
conversion, `normalize_claude_model`) are marked NOT DOC CODE.

Nothing imports these modules at server start-up. They `import anthropic` at
module scope as the pages do, and on this machine that import fails (see
`agents/routes/section_e.py`), so they are imported per request and the error
reaches the browser as an AG-UI RUN_ERROR instead of taking the server down.
"""
