import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startPreviewServer } from './test-preview-server.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = process.env.JW_PRELOAD_EVIDENCE || path.join(ROOT, '../preload-runtime-evidence.json');
const edge = process.env.JW_EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const framePattern = /\/golden-arrival\/frames\/ga-(\d{3})\.webp(?:\?|$)/;
const stills = [0, 108, 180, 312, 360];
const report = {
  generatedAt: new Date().toISOString(),
  browser: 'A separate headless Edge process; no user profile or existing CDP connection.',
  metrics: {
    uniqueFrameRequests: 'Distinct ga-NNN.webp URLs observed through Playwright request events.',
    sourceAssetBytes: 'Sum of local file lengths for distinct requested frames; not measured network transfer.',
    resourceTimingTransferBytes: 'Sum of browser Resource Timing transferSize for completed frame resources over local loopback; includes reported HTTP overhead and may be zero for cache hits. This is not a production performance benchmark.'
  },
  results: []
};
const preview = await startPreviewServer(ROOT);
let browser;
let failed = false;

async function withPage(options, work) {
  const context = await browser.newContext({
    viewport: options.mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 },
    isMobile: !!options.mobile, hasTouch: !!options.mobile
  });
  // The browser's default 250-entry buffer is smaller than the full frame sequence.
  await context.addInitScript(() => performance.setResourceTimingBufferSize(2000));
  const requests = [];
  const errors = [];
  const page = await context.newPage();
  if (options.saveData) {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        configurable: true, value: { saveData: true }
      });
    });
  }
  // Every scenario is local-only; third-party navigation and media are aborted.
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (new URL(url).origin !== new URL(preview.url).origin) return route.abort();
    if (options.frameDelay && framePattern.test(url)) {
      await new Promise((resolve) => setTimeout(resolve, options.frameDelay));
    }
    await route.continue();
  });
  page.on('request', (request) => {
    const match = request.url().match(framePattern);
    if (match) requests.push({ frame: Number(match[1]), elapsedMs: Date.now() - started });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const started = Date.now();
  const uniqueFrames = () => [...new Set(requests.map((r) => r.frame))].sort((a, b) => a - b);
  const snapshot = () => page.evaluate(() => {
    const image = document.querySelector('#process-journey .world-frame.is-active');
    const bounds = image && image.getBoundingClientRect();
    return {
      activated: window.PROCESS_JOURNEY?.activated,
      motion: window.PROCESS_JOURNEY?.motion,
      frame: window.PROCESS_JOURNEY?.frame,
      desiredFrame: window.PROCESS_JOURNEY?.desiredFrame,
      framesReady: window.PROCESS_JOURNEY?.framesReady,
      image: image ? {
        src: image.getAttribute('src'), complete: image.complete,
        naturalWidth: image.naturalWidth, opacity: getComputedStyle(image).opacity,
        width: bounds.width, height: bounds.height
      } : null
    };
  });
  const waitPaint = () => page.waitForFunction(() => {
    const image = document.querySelector('#process-journey .world-frame.is-active');
    return window.PROCESS_JOURNEY?.activated && window.PROCESS_JOURNEY.frame >= 0 &&
      image?.complete && image.naturalWidth > 0 && Number(getComputedStyle(image).opacity) > 0;
  }, undefined, { timeout: 12000 });
  try {
    const detail = await work({ page, requests, uniqueFrames, snapshot, waitPaint });
    await page.waitForTimeout(50);
    const frames = uniqueFrames();
    const resources = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter((entry) => /\/golden-arrival\/frames\/ga-\d{3}\.webp/.test(entry.name))
      .map((entry) => ({
        frame: Number(entry.name.match(/ga-(\d{3})/)[1]),
        transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize
      })));
    assert.deepEqual(errors, [], 'no page JavaScript errors');
    assert.equal(new Set(resources.map((entry) => entry.frame)).size, frames.length,
      'Resource Timing covers every distinct requested frame');
    return {
      ...detail, elapsedMs: Date.now() - started,
      uniqueFrameRequests: frames.length, requestedFrames: frames,
      sourceAssetBytes: frames.reduce((sum, frame) => sum + fs.statSync(
        path.join(ROOT, `assets/golden-arrival/frames/ga-${String(frame).padStart(3, '0')}.webp`)
      ).size, 0),
      resourceTimingTransferBytes: resources.reduce((sum, item) => sum + item.transferSize, 0),
      resourceTimingEncodedBodyBytes: resources.reduce((sum, item) => sum + item.encodedBodySize, 0),
      resourceTimingEntryCount: resources.length,
      pageErrors: errors, finalState: await snapshot()
    };
  } finally {
    await context.close();
  }
}

async function test(name, options, work) {
  const started = Date.now();
  try {
    const detail = await withPage(options, work);
    report.results.push({ name, passed: true, ...detail });
    console.log(`PASS ${name} (${detail.uniqueFrameRequests} unique frames, ${detail.elapsedMs} ms)`);
  } catch (error) {
    failed = true;
    report.results.push({ name, passed: false, elapsedMs: Date.now() - started, error: error.stack });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

try {
  browser = await chromium.launch({ executablePath: edge, headless: true });
  report.browserVersion = browser.version();

  await test('Homepage motion off does not activate or speculate before Process', {}, async ({ page, uniqueFrames, snapshot }) => {
    await page.goto(preview.url + '/?motion=off', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.PROCESS_JOURNEY);
    await page.waitForTimeout(1400);
    const state = await snapshot();
    assert.equal(state.activated, false);
    assert.equal(state.framesReady, 0);
    assert.ok(uniqueFrames().every((frame) => frame === 0 || frame === 360), 'only declarative opening/terminal artwork may load');
    return { initialState: state };
  });

  for (const mobile of [false, true]) {
    await test(`${mobile ? 'Mobile' : 'Desktop'} direct proof with motion off paints from five stills`, { mobile }, async ({ page, uniqueFrames, waitPaint, snapshot }) => {
      await page.goto(preview.url + '/?motion=off&station=proof', { waitUntil: 'domcontentloaded' });
      await waitPaint();
      await page.waitForFunction(() => window.PROCESS_JOURNEY.framesReady === 5 && window.PROCESS_JOURNEY.frame === 180);
      await page.waitForTimeout(250);
      assert.ok(uniqueFrames().length <= 5);
      assert.ok(uniqueFrames().every((frame) => stills.includes(frame)));
      return { paintedStill: await snapshot() };
    });
  }

  await test('Save-Data prevents full idle sequence while direct proof paints', { saveData: true }, async ({ page, uniqueFrames, waitPaint }) => {
    await page.goto(preview.url + '/?station=proof', { waitUntil: 'domcontentloaded' });
    await waitPaint();
    await page.waitForTimeout(1400);
    assert.ok(uniqueFrames().length < 100, 'bounded entry/opening/neighborhood frames only');
    await page.waitForFunction(() => window.PROCESS_JOURNEY.frame === window.PROCESS_JOURNEY.desiredFrame);
    const desired = await page.evaluate(() => window.PROCESS_JOURNEY.desiredFrame);
    assert.ok(uniqueFrames().includes(desired), 'active requested frame was fetched');
    return { simulatedSaveData: true, requestedActiveFrame: desired };
  });

  await test('Default full motion completes all 361 frames', {}, async ({ page, waitPaint }) => {
    await page.goto(preview.url + '/?station=proof', { waitUntil: 'domcontentloaded' });
    await waitPaint();
    await page.waitForFunction(() => window.PROCESS_JOURNEY.framesReady === 361, undefined, { timeout: 20000 });
    return { expectedFullSequenceFrames: 361 };
  });

  await test('Pause stops speculation; resume completes sequence without blank active buffers', { frameDelay: 40 }, async ({ page, requests, uniqueFrames, waitPaint, snapshot }) => {
    await page.goto(preview.url + '/?station=proof', { waitUntil: 'domcontentloaded' });
    await waitPaint();
    await page.evaluate(() => {
      window.__preloadPaintChecks = { samples: 0, blanks: 0, running: true };
      function sample() {
        const state = window.__preloadPaintChecks;
        if (!state.running) return;
        const image = document.querySelector('#process-journey .world-frame.is-active');
        state.samples++;
        if (!image?.complete || !image.naturalWidth || Number(getComputedStyle(image).opacity) <= 0) state.blanks++;
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page.locator('#process-journey .jw-pause-motion').click();
    await page.waitForFunction(() => window.PROCESS_JOURNEY.motion === false);
    await page.waitForTimeout(500);
    const afterDrain = requests.length;
    const paused = await snapshot();
    assert.ok(paused.framesReady < 361, 'paused before full sequence completion');
    await page.waitForTimeout(300);
    assert.equal(requests.length, afterDrain, 'no continuing speculative requests after in-flight drain');
    assert.ok(paused.image.complete && paused.image.naturalWidth > 0);
    const pausedUniqueFrames = uniqueFrames().length;
    await page.locator('#process-journey .jw-pause-motion').click();
    await page.waitForFunction(() => window.PROCESS_JOURNEY.motion === true);
    await page.waitForFunction(() => window.PROCESS_JOURNEY.framesReady === 361, undefined, { timeout: 20000 });
    const paintChecks = await page.evaluate(() => {
      window.__preloadPaintChecks.running = false;
      return window.__preloadPaintChecks;
    });
    assert.ok(paintChecks.samples > 0);
    assert.equal(paintChecks.blanks, 0);
    return { pausedUniqueFrames, pausedState: paused, paintChecks, frameResponseDelayMs: 40 };
  });
} catch (error) {
  failed = true;
  report.setupError = error.stack;
  console.error(error);
} finally {
  if (browser) await browser.close();
  await preview.close();
  report.passed = !failed;
  fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true });
  fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2) + '\n');
  console.log(`Evidence: ${EVIDENCE}`);
}
if (failed) process.exitCode = 1;
