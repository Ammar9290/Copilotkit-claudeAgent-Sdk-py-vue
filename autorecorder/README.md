# Autorecorder

Automated screen-recording suite for CopilotKit framework integrations. For each
documentation page it makes one demo video: it reads the doc, switches to a
simulated VS Code to show the implementing code, then switches to the browser and
drives the live feature.

Configured for **Claude Agent SDK (Python) + Vue** (`vue/claude-sdk-python`). It
covers the 43 nav routes of this repo that have a chrome-free `demo-chat` page.
Each recording is judged on its feature (a surface rendered, the filter changed,
the cart updated), not just on whether the agent replied.

> **Porting this to another framework?** Read **[ADAPT.md](ADAPT.md)** first.
> `core/` is frozen; the adaptation surface is `config/` and `actions/`.

---

## Run it

The stack must be up first. The recorder refuses to start otherwise, because a
video of a dead page is worse than no video.

```bash
cd backend && uv run python src/agent_server.py   # agent server :8100
cd frontend && npm run dev                        # Copilot Runtime :8300 + Vite :5273
```

If the app runs elsewhere, point the recorder at it: `FRONTEND_URL=http://localhost:<vite> BACKEND_URL=http://localhost:<agent> npm run doctor:online`.

```bash
cd autorecorder
npm install
npx playwright install chromium

npm run nav:check         # does pages.config still match the app's nav?
npm run doctor            # is the configuration complete? (doctor:online probes live URLs)
npm run sweep             # load all 94 routes, report page errors (no prompts sent)
npm run record -- --list  # what will be recorded
npm run record -- --quickstart
npm run record:each       # all pages, one process each, 5-min cap per page
npm run record            # all pages in one process (no per-page cap)
npm run pages:generate    # rebuild pages.config.ts after editing a demo or the nav
npm run probe -- frontend-tools/demo-chat --prompt "Show me only sev1 incidents."
```

| Flag | Effect |
|---|---|
| `--list`, `--help` | Print every registered route and exit |
| `--doctor` | Validate the configuration; exits 1 on error |
| `--doctor --online` | Also probe every doc/demo URL and the selectors |
| `--<page-id>` | Record one page — `--quickstart`, `--frontend-tools` |
| `--page=<id>` | Same thing, explicit form |
| `--filter=<query>` | Record every page whose id or name contains the query |
| `--force` | Record even if the pre-flight health check fails |

Videos land in `videos/` as `CLAUDESDK-PY-vue-<NN>-<Name>.webm`, 1920×1080, ~25fps.
**`videos/` is gitignored on purpose**: recordings are reproducible build output,
so publish them as release assets.

**Playwright is pinned to 1.62.1 on purpose.** On this machine Windows Application
Control blocks Chromium build 1254 (`chrome.dll … blocked`), which newer Playwright
releases download, but allows build 1234, which 1.62.1 uses. The headless shell used
by `probe`/`sweep` is not affected.

---

## Scope in this repo

The nav (`frontend/src/lib/nav-config.ts`) has 50 routes. 43 have a demo and all 43
are registered. The others are the Introduction and the seven Built-in Agent
sub-pages that 404 for Vue.

`config/pages.config.ts` is **generated** by `config/generate-pages.ts`. It takes
each `hasDemo` route from the nav, line ranges from the `[!code highlight:N]`
markers in its `Demo.vue`, and prompts from `config/page-scripts.ts`, each verified
live when the page was built. `nav:check` fails when the two drift.

### Before a full run

- **Warm the agent.** The first Claude CLI start can be slow. Record one page first.
- **Don't edit files during a run.** Vite's HMR does a full reload and wipes the chat mid-turn.
- **Agent replies vary.** A page that fails once (no reply in the window) is worth one re-run before treating it as broken.
- **Some pages need things this machine lacks:** internet (MCP Apps uses the public
  Excalidraw server), premium keys (Threads), and model keys in the runtime (Built-in
  Agent, model router).
- **Pages marked Broken in the app fail their recording on purpose.** Each handler
  checks the feature, and its error names the cause (see the repo README §7–§8).

### What each recording proves

| Page | Driven by | Fails when |
|---|---|---|
| Quickstart, Inspector, Copilot Runtime, Threads Drawer, Headless Threads | `runPromptAction` | no assistant reply |
| Prebuilt Components | reply → 👍 → Sidebar/Popup launchers | feedback never logged |
| Slots | "Show my open tickets" | no "Reviewed" toolbar badge |
| Fully Headless UI | the page's own composer | no markdown bullets in the custom bubble |
| Programmatic Control | **Run agent** | subscriber never logs `done` |
| Thread lifecycle | reply → New chat → Open conversation | thread id unchanged, no replay |
| Components / Catalogs / Standard catalog / From A2UI / Markdown / A2UI / Dynamic | prompt | the specific surface or component is absent |
| Surfaces | two prompts | featured target never fills / row never returns |
| State and actions | prompt → Add to cart ×2 | cart count not 2 |
| Theming / Transports | prompt (+ accent swap / tool mode) | no surface / no slider |
| Fixed Schema A2UI (❌) | prompt | no surface — fails today: "Catalog not found" |
| JSON Render / Hashbrown (⚠️) | prompt | the spec never appears in the reply |
| MCP Apps / Open Generative UI | prompt | no iframe |
| Tool Rendering (⚠️) | prompt | no tool card (per-tool card absence only warns) |
| Component as tool / Frontend Tools | prompt | no WeatherCard / filter not sev1 |
| Shared State, SubAgents (❌) | prompt | no note / no delegation — fails today on this machine |
| Rendering in app / Read-only context | click/select → prompt | canvas title unchanged / reply lacks "aurora" |
| HITL / Governed actions | prompt → pick slot / Approve | picker or card never shown |
| Built-in Agent (⚠️) | /info badge → prompt | BuiltInAgent not listed (no reply only warns) |
| Runtime endpoints | probe buttons | run never reaches RUN_FINISHED |
| Model router | prompt | no 72°F answer |
| AgentRunner | reply → Remount → Read store | no replay / store not 200 |
| Connect AG-UI agents | prompt | no `onToolCallResultEvent` |
| Authentication | reply → Bob's token → read Alice's thread | no 403 |

**Use `record:each` for full runs.** It isolates pages so one hang can't freeze the
suite (the engine has no per-page timeout and `core/` is frozen).

### Layout lift

The simulated taskbar covers the bottom 48px of the 1920×1080 viewport and
intercepts clicks. That is exactly where every full-height composer, the
CopilotKit sidebar's input, and the chat launcher sit in this app.
`liftAboveTaskbar` (in `actions/page-ready.ts`) injects a stylesheet that ends
those layouts 48px higher, so real clicks land and the whole composer stays on
screen.

---

## Tracking recordings

Clips are **not** in git, and every run overwrites the same 40 filenames in place
— so nothing about the files themselves says which are fresh. `npm run manifest`
is what closes that gap:

```bash
npm run record            # produces the clips
npm run manifest          # records their state — run this straight after
```

It writes two committed files next to the (uncommitted) videos:

| File | For |
|---|---|
| `videos/manifest.json` | source of truth — per clip: mtime, size, sha256, the source files it shows, and a hash of those files plus the page definition |
| `videos/MANIFEST.md` | the same thing as a table, readable on GitHub |

Commit both. **The diff on those files is the record of what a run changed** —
that is the whole mechanism. Together they are ~12KB, against ~84MB of video.

| Status | Means |
|---|---|
| ✅ current | clip matches the code it shows |
| 🆕 new | the clip changed since the last manifest — this run re-recorded it |
| ⚠️ stale | a source file was modified *after* the clip was recorded |
| ⚠️ drifted | mtimes look fine but the source content hash moved (mtimes all reset on a fresh clone, which hides staleness — this catches it) |
| ❌ missing | a registered page with no clip on disk |

A clip is judged against the files it actually puts on screen — its `ideFile` and
any `extraTabs` — plus its own page definition, so changing a prompt or a
highlighted line range marks it stale exactly as an edit to the code does.

`npm run manifest:check` prints without writing and exits 1 if anything is stale
or missing, which is the form to put in CI.

**What it does not tell you: whether the run passed.** Playwright saves the video
even when a page fails, so a clip from a failed run still looks current. Freshness
and correctness are different questions — the run summary answers the second one.

---

## Reading the summary

```
   ✅ [PASS]  (24.1s) Quickstart -> MSPY-react-01-Quickstart.webm
   ⚠️  [PASS*] (31.7s) Inspector -> MSPY-react-06-Inspector.webm
        · Doc page (…/inspector): Timeout 25000ms exceeded
   ❌ [FAIL]  (19.4s) AG-UI -> MSPY-react-17-AgUi.webm
        · Demo step failed: Agent never produced a response within 30s
```

- **PASS** — every step completed.
- **PASS\*** — recorded, but the external doc page misbehaved. The intro footage
  is degraded; the feature under test is not implicated.
- **FAIL** — the demo route 404'd, never rendered a chat surface, the agent never
  answered, or the IDE view could not be built. The process exits 1, so this is
  safe to gate CI on.

---

## Layout

The split between what you edit and what you don't is the point of this folder.

```
autorecorder/
├── ADAPT.md                    ← how to port this; read before editing
├── cli.ts                      ← entrypoint, arg parsing, summary
│
├── config/                     ← ★ THE ADAPTATION SURFACE
│   ├── project.config.ts         framework slug, doc root, URLs, start commands
│   ├── pages.config.ts           one entry per doc page
│   ├── nav-check.ts              pages.config vs the app nav (npm run nav:check)
│   └── selectors.config.ts       how to find the chat surface
│
├── actions/                    ← ★ what to DO on each page
│   ├── index.ts                  page id → handler, readiness + warm-up overrides
│   ├── helpers.ts                clickOn, expectVisible, clickSuggestion, finishTurn
│   ├── page-ready.ts             readiness gate + taskbar layout lift
│   └── *.action.ts               one file per doc section
│
├── core/                       ← ✖ DO NOT EDIT — no framework knowledge here
│   ├── engine.ts                 browser lifecycle, the 3-step sequence, pass/fail
│   ├── actions.ts                sendPrompt, response detection, standard action
│   ├── doctor.ts                 the adaptation contract, as a command
│   ├── diagnostics.ts            pre-flight health check
│   ├── types.ts                  PageDefinition → PageRecordConfig
│   ├── ide/generator.ts          VS Code simulator, Shiki-highlighted from disk
│   └── overlays/                 Windows 11 taskbar + virtual cursor
│
└── videos/                     ← output
```

Every framework-specific value lives in `config/`. If something in `core/` needs
to change for a port, that is a bug in this folder — see ADAPT.md.

---

## What a recording actually does

1. **Doc page** — opens the real documentation URL, waits for hydration, then
   scrolls at reading pace and rests the cursor on a code block. Clicks VS Code
   on the simulated taskbar.
2. **IDE** — renders the project's own source, read from disk and highlighted
   with Shiki, with the page's line range selected. Multi-tab pages switch tabs.
   Served from the frontend's origin via an intercepted route, so the doc page is
   fully unloaded rather than painted over. Clicks Chrome on the taskbar.
3. **Demo** — opens the chrome-free demo route, waits for it to be genuinely
   ready, types the prompt, waits for the reply to finish streaming, and pauses
   for reading.

Two details worth knowing, because both were bugs once:

- Overlays are injected as children of `<html>`, which React owns on any App
  Router page. `ensureOverlays` installs a MutationObserver that re-attaches them
  if a render pass deletes them, and step 1 waits for hydration before scrolling
  so a remount cannot snap the page back to the top.
- Playwright starts recording when the page is created, so the first navigation
  is dead footage. The doc URL is warmed in a throwaway page first, which cuts
  it roughly in half; removing the rest would need an ffmpeg trim in post.
- A dev server serves markup before it serves behaviour. "The route responded"
  and "the chat works" are different claims: client chunks compile lazily, and
  API routes compile on their *first request* — which would otherwise be the
  prompt. `actions/page-ready.ts` waits for the document to finish, the DOM to
  stop changing, the input to be genuinely enabled, and `runtimeWarmPath` to be
  built, before any handler types anything. Without it a cold route produces a
  video of a prompt that was never really sent.

---

## Troubleshooting

**`Aborting before launching a browser`** — a service is down. The message names
which one and the command to start it. `--force` overrides.

**A page fails with "Agent never produced a response within 30s"** — either the
demo is genuinely broken, or `selectors.config.ts → assistantMessage` does not
match this app's messages. Run `npm run doctor --online` to tell the two apart.

**The IDE highlights the wrong lines** — the line range drifted. `npm run doctor`
names the file and where its markers actually are now.

**A page fails only on the first run after starting the dev server** — it was
still compiling. The readiness gate absorbs this (it will log
`agent endpoint compiled in Ns` when it did real work), but the *agent's* own
cold start is separate: the first model call after starting the backend can take
~60s, which is longer than the 30s response window. Send one message by hand, or
record a single page, before running the full suite.

**A recording passes but the video is wrong** — the doctor cannot see cursor
placement or highlight correctness. Watch it.
