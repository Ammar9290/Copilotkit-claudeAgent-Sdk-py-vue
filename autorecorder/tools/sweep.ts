/**
 * Load every route in the nav (notes page, and `/demo-chat` where one exists)
 * and report anything that went wrong while it painted: uncaught page errors,
 * console errors, and failed or 5xx requests. No prompts are sent, so this is a
 * cheap check after any change to shared code.
 *
 *   npm run sweep            (FRONTEND_URL overrides http://localhost:5273)
 *
 * Exits 1 if any route has an uncaught page error or failed to render a header.
 * Console errors are listed but tolerated, because several doc pages fail by
 * design (premium-only runtimes answer 503) and those are recorded as Broken.
 */
import { chromium } from "playwright";

import { ALL_ROUTES } from "../../frontend/src/lib/nav-config";

const BASE = process.env.FRONTEND_URL ?? "http://localhost:5273";
const NOISE = [/Lit is in dev mode/, /scheduled an update .* after an update completed/, /fonts\.gstatic/];

const targets = ALL_ROUTES.flatMap((r) => [r.path, ...(r.hasDemo ? [`${r.path === "/" ? "" : r.path}/demo-chat`] : [])]);
targets.push("/status");

const browser = await chromium.launch();
let failed = 0;

for (const path of targets) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const fatal: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => fatal.push(String(e).split("\n")[0]));
  page.on("console", (m) => {
    if (m.type() === "error" && !NOISE.some((n) => n.test(m.text()))) errors.push(m.text().split("\n")[0].slice(0, 200));
  });
  page.on("response", (r) => {
    if (r.status() >= 500) errors.push(`${r.status()} ${r.url().replace(BASE, "")}`);
  });
  page.on("requestfailed", (r) => {
    if (!NOISE.some((n) => n.test(r.url())) && !/ERR_ABORTED/.test(r.failure()?.errorText ?? ""))
      errors.push(`FAILED ${r.url().replace(BASE, "")} ${r.failure()?.errorText ?? ""}`);
  });

  try {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45_000 });
  } catch (e) {
    fatal.push(`navigation: ${String(e).split("\n")[0]}`);
  }
  await page.waitForTimeout(1200);
  const heading = await page.locator("h1").first().textContent({ timeout: 2000 }).catch(() => null);
  if (!heading) fatal.push("no <h1> rendered");

  const mark = fatal.length ? "✗" : errors.length ? "!" : "✓";
  if (fatal.length) failed++;
  console.log(`${mark} ${path}${heading ? `  — ${heading.trim()}` : ""}`);
  for (const f of fatal) console.log(`    FATAL ${f}`);
  for (const e of [...new Set(errors)].slice(0, 5)) console.log(`    ${e}`);
  await page.close();
}

await browser.close();
console.log(`\n${targets.length} routes, ${failed} with fatal errors`);
process.exit(failed ? 1 : 0);
