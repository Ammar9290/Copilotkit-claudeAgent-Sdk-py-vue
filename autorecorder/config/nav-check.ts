/**
 * `npm run nav:check` -- is the recorder's page list still the app's nav?
 *
 * `pages.config.ts` is derived from `frontend/src/lib/nav-config.ts`. Nothing
 * kept the two in step, and they drifted: when this check was written the
 * recorder registered 27 pages while the nav had grown to 40 demos (Rich
 * Threads, JSON Render, Hashbrown and all eight Components-and-Surfaces routes
 * had been added since). Nobody noticed, because nothing fails when a page is
 * simply never recorded.
 *
 * This imports the nav module directly -- it is plain data with no imports of
 * its own -- and reports:
 *
 *   [x] a `hasDemo` route with no page here          (never recorded)
 *   [x] a page whose route has left the nav or lost its demo
 *   [x] a page whose docPath disagrees with the nav  (records the wrong doc)
 *   [!] pages out of nav order                       (video numbering drifts)
 *
 * Exits 1 on any [x]. Kept out of `doctor` only because `core/` is frozen;
 * it belongs there and should be ported with a configurable nav path.
 */

import { ALL_ROUTES, DOCS_ROOT } from '../../frontend/src/lib/nav-config';
import { PAGES } from './pages.config';
import { PROJECT } from './project.config';

/** Routes with a demo that are intentionally not recorded, with the reason. */
export const NAV_EXCLUSIONS: Record<string, string> = {};

const strip = (p: string): string => p.replace(/^\/+|\/+$/g, '');

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];

  const docPrefix = strip(new URL(DOCS_ROOT).pathname);
  if (strip(new URL(PROJECT.docBaseUrl).pathname) !== docPrefix) {
    errors.push(
      `project.config docBaseUrl (${PROJECT.docBaseUrl}) is not the nav's DOCS_ROOT (${DOCS_ROOT})`,
    );
  }

  const navDemos = ALL_ROUTES.filter((r) => r.hasDemo && r.path !== '/');
  const byRoute = new Map(PAGES.map((p) => [strip(p.route), p]));

  for (const route of navDemos) {
    const key = strip(route.path);
    if (NAV_EXCLUSIONS[key]) continue;

    const page = byRoute.get(key);
    if (!page) {
      errors.push(`nav route /${key} ("${route.title}") has a demo but no page in pages.config`);
      continue;
    }

    // The nav stores docPath with the framework prefix; pages store it without.
    const navDoc = strip(route.docPath).replace(new RegExp(`^${docPrefix}/?`), '');
    if (strip(page.docPath) !== navDoc) {
      errors.push(
        `${page.id}: docPath "${page.docPath}" but the nav says "${navDoc || '(root)'}"`,
      );
    }
  }

  const navKeys = new Set(navDemos.map((r) => strip(r.path)));
  for (const page of PAGES) {
    if (!navKeys.has(strip(page.route))) {
      errors.push(`${page.id}: route /${strip(page.route)} is not a hasDemo route in the nav`);
    }
  }

  // Video numbers come from registry order, so it should follow the nav.
  const navOrder = navDemos.map((r) => strip(r.path)).filter((k) => byRoute.has(k));
  const pageOrder = PAGES.map((p) => strip(p.route)).filter((k) => navKeys.has(k));
  const firstDiff = navOrder.findIndex((k, i) => pageOrder[i] !== k);
  if (firstDiff !== -1) {
    warnings.push(
      `pages are not in nav order from #${firstDiff + 1}: nav has /${navOrder[firstDiff]}, ` +
        `pages.config has /${pageOrder[firstDiff]}`,
    );
  }

  console.log(`\n=== NAV CHECK ===`);
  console.log(`  nav demos : ${navDemos.length}`);
  console.log(`  pages     : ${PAGES.length}`);
  console.log(`  excluded  : ${Object.keys(NAV_EXCLUSIONS).length}\n`);

  for (const e of errors) console.log(`  [x] ${e}`);
  for (const w of warnings) console.log(`  [!] ${w}`);
  if (!errors.length && !warnings.length) {
    console.log('  [ok] pages.config matches the app nav.');
  }
  console.log('');
  return errors.length ? 1 : 0;
}

process.exit(main());
