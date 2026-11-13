"""Worker G — the backend both State Rendering and State Streaming publish.

Both pages print the same block, titled
`src/app/demos/shared-state-streaming/state_streaming_backend.snippet.py`.
It is in `state_streaming_backend.py`, verbatim.

`stream_document_state` consumes an `anthropic_stream` (raw Messages API
events: `content_block_start`, `content_block_delta` / `input_json_delta`).
Neither page shows where that stream comes from or what wraps it. The page's
`agent.py` excerpt sits deep inside a streamed tool-argument handler, so the
loop around it is the raw `anthropic` Messages API loop, as on the Shared
State page. That loop is repo-authored, in `state_streaming_agent.py`, and
marked NOT DOC CODE.

`state_streaming_agent.py` imports `anthropic` and is imported per request,
so an import failure (README §8) or a missing ANTHROPIC_API_KEY reaches the
browser as an AG-UI RUN_ERROR.
"""
