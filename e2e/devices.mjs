// End-to-end test bench: each "phone" is an isolated browser context with its own storage, and therefore
// its own key. The phones share nothing but the network.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pointCameraAtNothing } from './fake-camera.mjs';

export const BASE = process.env.TEFI_BASE_URL || 'http://localhost:4173';
export const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(SHOTS, { recursive: true });
// What the camera of every phone is looking at (see fake-camera.mjs)
export const CAMERA_FEED = path.join(SHOTS, 'camera.y4m');

const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// Uses a browser that is already installed: TEFI_BROWSER_CHANNEL = chrome (default) | msedge | chromium
// ("chromium" is the one downloaded by `npx playwright-core install chromium`).
export async function launch() {
  const channel = process.env.TEFI_BROWSER_CHANNEL || 'chrome';
  pointCameraAtNothing(CAMERA_FEED);
  return chromium.launch({
    channel,
    headless: true,
    // The camera of the phones is a video file this run rewrites, so the app scans through its real camera code
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${CAMERA_FEED}`]
  });
}

export async function newDevice(browser, name) {
  const context = await browser.newContext({ ...PHONE, locale: 'en-US', permissions: ['camera', 'clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 400));
  });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('dialog', d => d.accept());

  // Every RPC call this phone makes: method, HTTP status and time
  const rpc = [];
  page.on('response', response => {
    const request = response.request();
    if (request.method() !== 'POST' || request.resourceType() !== 'fetch') return;
    let method;
    try {
      method = JSON.parse(request.postData() || '{}').method;
    } catch (e) {
      return;
    }
    if (method) rpc.push({ t: Date.now(), device: name, method, status: response.status() });
  });

  const shot = async label => {
    const file = path.join(SHOTS, `${label}.png`);
    await page.screenshot({ path: file });
    return file;
  };
  const storageKeys = () => page.evaluate(() => Object.keys(localStorage).sort());
  return { name, context, page, errors, rpc, shot, storageKeys };
}

/** The version of the app a phone shows on the screen it is on (every screen has it). */
export const shownVersion = async device => (await device.page.getByTestId('tefi-version').innerText()).trim();

/** The version the build under test says it is: version.json is written by the same build. */
export const publishedVersion = async () => (await fetch(`${BASE.replace(/\/$/, '')}/version.json`)).json();

/** First use of a phone: choose the role and type the name of the store or of the neighbor. */
export async function setUpPhone(device, role, ownName) {
  await device.page.goto(BASE);
  device.versionAtFirstUse = await shownVersion(device);
  await device.page.getByText(role === 'store' ? "I'm the store" : "I'm a neighbor").click();
  await device.page.getByRole('textbox').fill(ownName);
  await device.page.getByRole('button', { name: 'Continue' }).click();
  await device.page.getByText(role === 'store' ? 'Total Pending Receivables' : 'At the Store?').waitFor();
}

export function check(condition, label) {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}`);
  if (!condition) process.exitCode = 1;
  return condition;
}

// RPC traffic of all phones. The public devnet node limits requests per IP and every phone here shares one,
// so the summary reports how many requests were made and how many were rejected (the app retries those itself).
export function rpcSummary(devices) {
  const all = devices.flatMap(d => d.rpc).sort((a, b) => a.t - b.t);
  let worstWindow = 0;
  for (let i = 0, j = 0; i < all.length; i++) {
    while (all[i].t - all[j].t > 10_000) j++;
    worstWindow = Math.max(worstWindow, i - j + 1);
  }
  const byMethod = {};
  for (const call of all) byMethod[call.method] = (byMethod[call.method] ?? 0) + 1;
  return {
    requests: all.length,
    seconds: all.length ? Math.round((all[all.length - 1].t - all[0].t) / 1000) : 0,
    mostRequestsInTenSeconds: worstWindow,
    rateLimited: all.filter(call => call.status === 429).length,
    byDevice: Object.fromEntries(devices.map(d => [d.name, d.rpc.length])),
    byMethod
  };
}
