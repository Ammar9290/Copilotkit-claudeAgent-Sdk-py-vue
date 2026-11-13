/**
 * Dev probe: drive one route headlessly and report what happened.
 *
 *   npx tsx tools/probe.ts <route> [--prompt "text"] [--wait 60] [--shot out.png]
 *                          [--click "css or text=…"]... [--eval "js expr"]
 *
 * Opens FRONTEND_URL + route, optionally clicks things, types the prompt into
 * the first chat textarea and presses Enter, then waits until no network
 * request to the runtime has been in flight for 4s (or --wait seconds pass).
 * Prints console errors, failed/4xx/5xx requests, AG-UI RUN_ERROR lines, and
 * the visible text of the page. Used while building pages; the recorder proper
 * lives in cli.ts.
 */
import { chromium } from "playwright";

const args = process.argv.slice(2);
// Git Bash rewrites a leading "/" into a Windows path, so routes may be given without it.
const route = "/" + (args[0] ?? "").replace(/^.*?Git[\\/]/, "").replace(/^\/+/, "");
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const all = (name: string) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));

const BASE = process.env.FRONTEND_URL ?? "http://localhost:5273";
const prompt = opt("prompt");
const waitS = Number(opt("wait") ?? 90);
const shot = opt("shot");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
const bad: string[] = [];
let inflight = 0;
let lastActivity = Date.now();

page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text().slice(0, 400)}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 400)}`));
page.on("request", (r) => {
  if (r.url().includes("/api/")) {
    inflight++;
    lastActivity = Date.now();
  }
});
const done = (r: { url(): string }) => {
  if (r.url().includes("/api/")) {
    inflight = Math.max(0, inflight - 1);
    lastActivity = Date.now();
  }
};
page.on("requestfinished", done);
page.on("requestfailed", (r) => {
  done(r);
  bad.push(`FAILED ${r.method()} ${r.url()} ${r.failure()?.errorText ?? ""}`);
});
page.on("response", async (r) => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  if (r.url().includes("/api/") && (r.headers()["content-type"] ?? "").includes("event-stream")) {
    try {
      const body = await r.text();
      for (const line of body.split("\n")) if (line.includes("RUN_ERROR")) bad.push(`RUN_ERROR ${line.slice(0, 400)}`);
    } catch {
      /* stream closed */
    }
  }
});

await page.goto(BASE + route, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

for (const sel of all("click")) {
  try {
    await page.locator(sel).first().click({ timeout: 10_000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    errors.push(`[probe] could not click ${sel}: ${String(e).split("\n")[0]}`);
  }
}

if (prompt) {
  const box = page.locator("textarea").first();
  await box.click();
  await box.fill(prompt);
  await box.press("Enter");
  lastActivity = Date.now();
  const deadline = Date.now() + waitS * 1000;
  await page.waitForTimeout(3000);
  while (Date.now() < deadline) {
    if (inflight === 0 && Date.now() - lastActivity > 4000) break;
    await page.waitForTimeout(500);
  }
}

const evalExpr = opt("eval");
if (evalExpr) console.log("EVAL:", JSON.stringify(await page.evaluate(evalExpr)));

if (shot) await page.screenshot({ path: shot, fullPage: false });
const text = (await page.locator("body").innerText()).replace(/\n{3,}/g, "\n\n");
console.log(`=== ${route} — visible text ===\n${text.slice(0, 4000)}`);
console.log(`=== console (${errors.length}) ===\n${errors.slice(0, 25).join("\n")}`);
console.log(`=== network problems (${bad.length}) ===\n${bad.slice(0, 25).join("\n")}`);
await browser.close();
