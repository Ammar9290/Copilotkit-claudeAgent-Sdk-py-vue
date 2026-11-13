/**
 * `npm run record:each` -- the full suite, one page per process, with a cap.
 *
 * `npm run record` drives every page inside one browser and one process, and
 * the engine has no per-page time limit. That is fine until a page hangs: on
 * 2026-11-05 a renderer crash on the external docs site ("Target crashed")
 * left the run frozen on page 14 for 45 minutes with no output, and every page
 * after it went unrecorded. `cli.ts` is frozen (ADAPT.md), so the guard lives
 * here, beside it, the same way `manifest.ts` does.
 *
 * Each page runs as `tsx cli.ts --<id>` in its own process. A page that
 * exceeds the cap is killed and reported as TIMEOUT, and the run moves on.
 *
 *   npm run record:each                        all pages
 *   npm run record:each -- --from=voice        start at a page id (resume)
 *   npm run record:each -- --filter=shared     ids containing the text
 *   npm run record:each -- --timeout=420       per-page cap in seconds (default 300)
 *
 * Exits 1 if any page failed or timed out, so it is safe to gate CI on.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { PAGES } from './config/pages.config';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

const timeoutS = Number(arg('timeout') ?? 300);
const from = arg('from');
const filter = arg('filter');

let pages = PAGES;
if (from) {
  const i = pages.findIndex((p) => p.id === from);
  if (i === -1) {
    console.error(`Unknown page id for --from: ${from}`);
    process.exit(1);
  }
  pages = pages.slice(i);
}
if (filter) pages = pages.filter((p) => p.id.includes(filter));

type Outcome = 'PASS' | 'PASS*' | 'FAIL' | 'TIMEOUT';

function runOne(id: string): Promise<{ outcome: Outcome; secs: number; reason: string }> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('npx', ['tsx', 'cli.ts', `--${id}`], {
      cwd: here,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let out = '';
    const collect = (d: Buffer): void => {
      const text = d.toString();
      out += text;
      process.stdout.write(text);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // shell:true means the real work is a grandchild; kill the whole tree.
      if (process.platform === 'win32' && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      } else {
        child.kill('SIGKILL');
      }
    }, timeoutS * 1000);

    child.on('close', (code) => {
      clearTimeout(timer);
      const secs = Math.round((Date.now() - started) / 1000);
      const reason = (out.match(/·\s+(.+)/)?.[1] ?? '').trim();
      if (timedOut) return resolve({ outcome: 'TIMEOUT', secs, reason: `no result within ${timeoutS}s` });
      if (/\[FAIL\]/.test(out) || code !== 0) return resolve({ outcome: 'FAIL', secs, reason });
      if (/\[PASS\*\]/.test(out)) return resolve({ outcome: 'PASS*', secs, reason });
      resolve({ outcome: 'PASS', secs, reason: '' });
    });
  });
}

const icon: Record<Outcome, string> = { PASS: '✅', 'PASS*': '⚠️ ', FAIL: '❌', TIMEOUT: '⏱️ ' };

(async () => {
  console.log(`Recording ${pages.length} page(s), one process each, ${timeoutS}s cap.\n`);
  const results: { id: string; outcome: Outcome; secs: number; reason: string }[] = [];

  for (const page of pages) {
    const r = await runOne(page.id);
    results.push({ id: page.id, ...r });
  }

  console.log('\n======================================================');
  console.log('📊 RECORD-EACH SUMMARY');
  console.log('======================================================');
  for (const r of results) {
    console.log(`   ${icon[r.outcome]} [${r.outcome}] (${r.secs}s) ${r.id}`);
    if (r.reason) console.log(`        · ${r.reason.slice(0, 240)}`);
  }
  const bad = results.filter((r) => r.outcome === 'FAIL' || r.outcome === 'TIMEOUT');
  console.log(`\n   ${results.length - bad.length} passed, ${bad.length} failed or timed out`);
  process.exit(bad.length ? 1 : 0);
})();
