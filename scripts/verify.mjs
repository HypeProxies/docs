#!/usr/bin/env node
// End-to-end check of the built site: serves dist/ with `astro preview`, drives it with Playwright,
// writes screenshots and results.json to .verify/ and exits non-zero when a check fails.
//
//   npm run build && npm run verify
//
// Needs Playwright's Chromium once: npx playwright install chromium
import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, '.verify');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'service', path: '/mac-mini/' },
  { name: 'guide', path: '/mac-mini/connecting.html' },
  { name: 'reseller-api', path: '/api/reseller/' },
];
const MODES = [
  { name: 'light-desktop', viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
  { name: 'dark-desktop', viewport: { width: 1440, height: 900 }, colorScheme: 'dark' },
  { name: 'light-phone', viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true },
];
// Every URL the Jekyll site served (its sitemap.xml, plus the files beside it).
const LEGACY_PATHS = [
  '/',
  '/mac-mini/',
  '/mac-mini/connecting.html',
  '/bare-metal/',
  '/vps/',
  '/proxy/',
  '/404.html',
  '/search.json',
  '/sitemap.xml',
  '/robots.txt',
  '/assets/img/favicon-32.png',
  '/assets/img/apple-touch-icon.png',
  '/assets/img/logo-mark.png',
];
const GUIDE_ANCHORS = ['kvm-console-free', 'turn-off-password-login-for-ssh-recommended', 'troubleshooting'];

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Hex colors or default Tailwind colors in our own styles and markup (tokens.css is the one allowed source). */
async function scanForRawColors() {
  const offenders = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(css|astro|tsx?|mjs)$/.test(entry.name) && entry.name !== 'tokens.css') {
        const text = await readFile(path, 'utf8');
        const hex = text.match(/#[0-9a-f]{3,8}\b(?![\w-])/gi)?.filter((m) => !/^#\d+$/.test(m) || m.length > 4);
        const tw = text.match(/\b(?:bg|text|border|fill|stroke|ring|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d+)?\b/g);
        if (hex?.length || tw?.length) offenders.push(`${path.slice(ROOT.length)}: ${[...(hex ?? []), ...(tw ?? [])].join(' ')}`);
      }
    }
  }
  await walk(join(ROOT, 'src'));
  return offenders;
}

/** The preview server runs in its own process group; stop all of it. */
function stop(server) {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    // already gone
  }
}

/**
 * Starts `astro preview` and resolves with its URL, read from the server's own ready line (it moves
 * to another port when 4329 is taken). The server gets its own process group so stop() ends it
 * all, also on Ctrl-C.
 */
async function startPreview() {
  // Astro keeps a preview lock file; --ignore-lock lets a run start even if an old server left one.
  const server = spawn(join(ROOT, 'node_modules/.bin/astro'), ['preview', '--port', '4329', '--ignore-lock'], {
    cwd: ROOT,
    detached: true,
    // No color codes, so the ready line can be read.
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      stop(server);
      process.exit(128 + constants.signals[signal]);
    });
  }
  return new Promise((resolve, reject) => {
    let output = '';
    const fail = (message) => {
      clearTimeout(timer);
      stop(server);
      reject(new Error(`${message}\n${output}`));
    };
    const timer = setTimeout(() => fail('astro preview did not start; run `npm run build` first.'), 30000);
    const onData = (chunk) => {
      output += chunk;
      // A complete URL only: the ready line can arrive split across chunks.
      const url = output.match(/http:\/\/localhost:\d+(?=\/)/)?.[0];
      if (!url) return;
      clearTimeout(timer);
      server.stdout.off('data', onData);
      server.stdout.resume(); // keep draining the server's output
      server.removeAllListeners('exit');
      server.on('exit', (code, signal) => signal !== 'SIGTERM' && console.error(`astro preview stopped early (${code}).`));
      resolve({ server, base: url });
    };
    server.stdout.on('data', onData);
    server.on('error', (error) => fail(`astro preview could not start (${error.message}); run \`npm ci\` first.`));
    server.on('exit', (code) => fail(`astro preview exited (${code}).`));
  });
}

/** Opens a page, fails the run on console errors and requests that leave localhost. */
async function open(context, path, label) {
  const page = await context.newPage();
  const external = [];
  const errors = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:') external.push(url.href);
  });
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  if (path.startsWith('/api/reseller')) {
    await page.waitForSelector('.scalar-app', { timeout: 20000 });
    await page.waitForTimeout(800);
  }
  await page.evaluate(() => document.fonts.ready);
  page.finish = () => {
    check(`${label}: no requests outside the site`, external.length === 0, external.slice(0, 3).join(', '));
    check(`${label}: no console errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
  };
  return page;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const offenders = await scanForRawColors();
check('src uses c6 tokens only (no hex or Tailwind palette colors outside tokens.css)', offenders.length === 0, offenders.join('; '));

let server;
let BASE;
let browser;
try {
  ({ server, base: BASE } = await startPreview());
  browser = await chromium.launch();
  // Old URLs still answer.
  for (const path of LEGACY_PATHS) {
    const response = await fetch(BASE + path);
    check(`legacy URL ${path} answers 200`, response.status === 200, response.status);
  }

  // Screenshots: every page in every mode, plus layout checks per page.
  for (const mode of MODES) {
    const context = await browser.newContext({
      viewport: mode.viewport,
      colorScheme: mode.colorScheme,
      isMobile: mode.isMobile ?? false,
      hasTouch: mode.hasTouch ?? false,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    });
    for (const { name, path } of PAGES) {
      const label = `${name} ${mode.name}`;
      const page = await open(context, path, label);
      const width = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      check(`${label}: no horizontal scroll`, width.scroll <= width.client, `${width.scroll} > ${width.client}`);
      const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      check(`${label}: body follows the ${mode.colorScheme} theme`, (dark === 'rgb(17, 17, 19)') === (mode.colorScheme === 'dark'), dark);
      if (name === 'reseller-api') {
        const scalarDark = await page.evaluate(() => document.querySelector('.dark-mode') !== null);
        check(`${label}: Scalar mode follows the site theme`, scalarDark === (mode.colorScheme === 'dark'));
      }
      await page.screenshot({ path: join(OUT, `${name}-${mode.name}.png`), fullPage: name !== 'reseller-api' });
      page.finish();
      await page.close();
    }
    await context.close();
  }

  // Guide page: anchors, fonts, copy buttons, note boxes.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await open(context, '/mac-mini/connecting.html', 'guide checks');
    for (const id of GUIDE_ANCHORS) {
      check(`guide anchor #${id} exists`, await page.locator(`[id="${id}"]`).count());
    }
    const fonts = await page.evaluate(() => ({
      inter: document.fonts.check('500 14px Inter'),
      mono: document.fonts.check('400 13px "JetBrains Mono"'),
      ui: getComputedStyle(document.body).fontFamily,
    }));
    check('Inter is loaded and used for UI', fonts.inter && fonts.ui.startsWith('Inter'), fonts.ui);
    check('JetBrains Mono is loaded for code', fonts.mono);
    check('code blocks have a Copy button', (await page.locator('.prose pre').count()) === (await page.locator('.copy-btn').count()));
    await page.close();
    await context.close();
  }

  // Search: type, see the guide, press Enter, land on it.
  for (const mode of [MODES[0], MODES[2]]) {
    const context = await browser.newContext({ viewport: mode.viewport, isMobile: mode.isMobile ?? false, hasTouch: mode.hasTouch ?? false });
    const page = await open(context, '/vps/', `search ${mode.name}`);
    if (mode.isMobile) {
      await page.click('[data-nav-toggle]');
      await page.waitForTimeout(400);
    }
    await page.fill('#search-input', 'kvm console');
    const first = page.locator('#search-results .search-result').first();
    await first.waitFor({ timeout: 5000 });
    check(`search (${mode.name}): "kvm console" finds the Mac mini guide`, (await first.getAttribute('href')) === '/mac-mini/connecting.html');
    await page.screenshot({ path: join(OUT, `search-${mode.name}.png`) });
    await page.keyboard.press('Enter');
    await page.waitForURL('**/mac-mini/connecting.html');
    check(`search (${mode.name}): Enter opens the result`, page.url().endsWith('/mac-mini/connecting.html'));
    if (mode.isMobile) {
      await page.click('[data-nav-toggle]');
      await page.waitForTimeout(400);
    }
    await page.fill('#search-input', 'webhooks');
    const api = page.locator('#search-results .search-result[href="/api/reseller/"]');
    await api.first().waitFor({ timeout: 5000 }).catch(() => {});
    const count = await api.count();
    check(`search (${mode.name}): finds the reseller API reference once`, count === 1, `${count} results`);
    page.finish();
    await context.close();
  }

  // Theme toggle: switch to dark on one page, the choice survives navigation and reloads.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
    const page = await open(context, '/', 'theme toggle');
    await page.click('[data-theme-toggle]');
    check('theme toggle switches to dark', (await page.getAttribute('html', 'data-theme')) === 'dark');
    await page.goto(`${BASE}/api/reseller/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.scalar-app');
    await page.waitForTimeout(800);
    check('dark choice persists on the next page', (await page.getAttribute('html', 'data-theme')) === 'dark');
    check('Scalar follows the toggled theme', await page.evaluate(() => document.querySelector('.dark-mode') !== null));
    await page.screenshot({ path: join(OUT, 'reseller-api-dark-via-toggle.png') });
    await page.click('[data-theme-toggle]');
    await page.waitForTimeout(500);
    check('toggle back to light reaches Scalar', await page.evaluate(() => document.querySelector('.light-mode') !== null && document.querySelector('.dark-mode') === null));
    await page.reload({ waitUntil: 'networkidle' });
    check('light choice persists after reload', (await page.getAttribute('html', 'data-theme')) === 'light');
    await context.close();
  }

  // 404 page.
  {
    const response = await fetch(`${BASE}/no-such-page`);
    check('unknown URL returns the 404 page', response.status === 404 && (await response.text()).includes('Page not found'), response.status);
  }
} catch (error) {
  // A step that throws (a timeout, a crash) is a failed check; results.json is still written.
  check('verify ran to the end', false, error?.stack ?? String(error));
} finally {
  await browser?.close();
  if (server) stop(server);
}

const failed = results.filter((r) => !r.ok);
await writeFile(join(OUT, 'results.json'), `${JSON.stringify({ when: new Date().toISOString(), results }, null, 2)}\n`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots and results.json are in .verify/`);
process.exit(failed.length ? 1 : 0);
