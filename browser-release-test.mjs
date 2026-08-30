#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { startPreviewServer } from './test-preview-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = process.env.JW_EVIDENCE_DIR || path.join(os.tmpdir(), 'jarrettwroten-full-candidate-evidence-a43a010c');
fs.mkdirSync(EVIDENCE, { recursive: true });

function findEdge() {
  const candidates = [
    process.env.JW_EDGE_PATH,
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft/Edge/Application/msedge.exe'),
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable'
  ].filter(Boolean);
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  try {
    const command = process.platform === 'win32' ? 'where.exe' : 'which';
    return execFileSync(command, [process.platform === 'win32' ? 'msedge.exe' : 'microsoft-edge'], { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
  } catch {}
  throw new Error('Microsoft Edge was not found. Set JW_EDGE_PATH to its executable.');
}

const preview = process.env.JW_TEST_URL ? null : await startPreviewServer(ROOT);
const BASE = process.env.JW_TEST_URL || preview.url;
const EDGE = findEdge();

const failures = [];
const report = { base: BASE, generatedAt: new Date().toISOString(), routes: [], root: {}, mobile: {}, reducedMotion: {} };
function check(value, message) {
  if (value) console.log('OK', message);
  else { console.error('FAIL', message); failures.push(message); }
}
function slug(route) {
  return route === '/' ? 'root' : route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
}

async function touchSwipe(page, fromY, toY) {
  const client = await page.context().newCDPSession(page);
  const x = Math.round((await page.evaluate(() => innerWidth)) / 2);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY, radiusX: 8, radiusY: 8, force: 1 }] });
  for (let step = 1; step <= 6; step++) {
    const y = fromY + (toY - fromY) * (step / 6);
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, radiusX: 8, radiusY: 8, force: 1 }] });
    await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

const browser = await chromium.launch({ headless: true, executablePath: EDGE });

async function renderRoute(route, viewport, label) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    h1: document.querySelector('h1')?.textContent.trim() || '',
    status: document.querySelector('.case-status')?.textContent.trim() || '',
  }));
  const shot = path.join(EVIDENCE, label + '-' + slug(route) + '.png');
  await page.screenshot({ path: shot, fullPage: !['/', '/work/'].includes(route) });
  check(response && response.status() === 200, label + ' ' + route + ' returns 200');
  check(errors.length === 0, label + ' ' + route + ' has no browser errors');
  check(state.width <= state.clientWidth + 1, label + ' ' + route + ' has no horizontal overflow');
  report.routes.push({ route, label, status: response?.status(), errors, state, screenshot: shot });
  await context.close();
}

for (const route of ['/', '/work/', '/work/generations-kitchen/', '/work/paina-cafe/', '/work/rana-levy/', '/work/dylan-prorok/', '/privacy/']) {
  await renderRoute(route, { width: 1280, height: 720 }, 'desktop');
  await renderRoute(route, { width: 390, height: 844 }, 'mobile');
}

report.dylanPrinciples = [];
for (const viewport of [{ width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(BASE + '/work/dylan-prorok/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.dylan-principle')].map((row) => {
    const heading = row.querySelector('h3');
    const paragraph = row.querySelector('p');
    const h = heading.getBoundingClientRect();
    const p = paragraph.getBoundingClientRect();
    return {
      heading: heading.textContent.trim(),
      headingBox: { left: h.left, right: h.right, top: h.top, bottom: h.bottom },
      paragraphBox: { left: p.left, right: p.right, top: p.top, bottom: p.bottom },
      disjoint: h.right <= p.left + .01,
      headingFits: heading.scrollWidth <= heading.clientWidth + 1
    };
  }));
  check(rows.length === 3 && rows.every((row) => row.disjoint && row.headingFits), 'Dylan principle headings stay disjoint from copy at ' + viewport.width + 'x' + viewport.height);
  const screenshot = path.join(EVIDENCE, 'dylan-principles-' + viewport.width + 'x' + viewport.height + '.png');
  await page.locator('.dylan-principles').screenshot({ path: screenshot });
  report.dylanPrinciples.push({ viewport, rows, screenshot });
  await context.close();
}

async function readPassageMotion(page, route) {
  return page.evaluate((currentRoute) => ({
    value: document.documentElement.getAttribute('data-motion'),
    source: document.documentElement.getAttribute('data-motion-source'),
    controls: [...document.querySelectorAll('#portfolio-motion-toggle,#process-motion-toggle,#motion-toggle')].map((element) => element.textContent.trim()),
    legacyStored: localStorage.getItem('jw-motion'),
    generationsPaused: document.getElementById(currentRoute === '/' ? 'portfolio-generations-video' : 'generations-video')?.paused,
    portfolio: window.ROOT_PORTFOLIO_PASSAGE?.motion,
    process: window.PROCESS_JOURNEY?.motion,
    work: window.WORK_PASSAGE?.motion
  }), route);
}

{
  const scenarios = [
    { name: 'default-on', query: '', stored: '', reducedMotion: 'no-preference', expected: 'on', source: 'os' },
    { name: 'os-reduce', query: '', stored: '', reducedMotion: 'reduce', expected: 'off', source: 'os' },
    { name: 'query-off-over-stored-on', query: '?motion=off', stored: 'on', reducedMotion: 'no-preference', expected: 'off', source: 'query' },
    { name: 'query-on-over-stored-off', query: '?motion=on', stored: 'off', reducedMotion: 'reduce', expected: 'on', source: 'query' },
    { name: 'stale-stored-off-is-retired', query: '', stored: 'off', reducedMotion: 'no-preference', expected: 'on', source: 'os' }
  ];
  report.motion = [];
  for (const route of ['/', '/work/']) {
    for (const scenario of scenarios) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: scenario.reducedMotion });
      await context.addInitScript((stored) => {
        localStorage.removeItem('jw-motion');
        if (stored) localStorage.setItem('jw-motion', stored);
      }, scenario.stored);
      const page = await context.newPage();
      await page.goto(BASE + route + scenario.query, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      const state = await readPassageMotion(page, route);
      const controllerValues = route === '/' ? [state.portfolio, state.process] : [state.work];
      check(state.value === scenario.expected && state.source === scenario.source, route + ' ' + scenario.name + ' resolves deterministic motion precedence');
      check(controllerValues.every((value) => value === (scenario.expected === 'on')), route + ' ' + scenario.name + ' initializes every route controller consistently');
      check(state.controls.length === 0, route + ' ' + scenario.name + ' renders no motion control');
      check(state.legacyStored === null, route + ' ' + scenario.name + ' removes legacy stored motion state');
      if (scenario.expected === 'off') check(state.generationsPaused === true, route + ' ' + scenario.name + ' keeps Generations paused');
      report.motion.push({ route, ...scenario, state });
      await context.close();
    }
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.removeItem('jw-motion'));
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(150);
  const osUpdated = await readPassageMotion(page, '/');
  check(osUpdated.value === 'on' && osUpdated.portfolio === true && osUpdated.process === true, 'OS motion changes update both controllers before an explicit choice');
  await page.goto(BASE + '/?motion=off', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(150);
  const explicitHeld = await readPassageMotion(page, '/');
  check(explicitHeld.value === 'off' && explicitHeld.portfolio === false && explicitHeld.process === false && explicitHeld.controls.length === 0, 'hidden query choice is not overwritten by later OS changes and adds no control');
  report.motionOsChange = { osUpdated, explicitHeld };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto(BASE + '/work/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const framing = await page.evaluate(() => {
    const ids = ['generations-poster','generations-video','paina-poster','paina-video','rana-poster','rana-studio-video','ring-poster','rana-ring-video','prorok-poster','prorok-ink-video','prorok-portrait','terminal-return'];
    return ids.map((id) => {
      const style = getComputedStyle(document.getElementById(id));
      return { id, objectFit: style.objectFit, objectPosition: style.objectPosition, transform: style.transform };
    });
  });
  check(framing.every((item) => item.objectFit === 'contain' && item.objectPosition === '50% 50%' && item.transform === 'none'), 'standalone Work desktop preserves complete centered source plates');
  await page.evaluate(() => {
    const passage = document.getElementById('passage');
    const viewport = document.getElementById('viewport');
    window.scrollTo(0, window.WORK_PASSAGE.still.process * (passage.offsetHeight - viewport.offsetHeight));
  });
  await page.waitForTimeout(1300);
  await page.click('.scene-copy--terminal .scene-action');
  await page.waitForURL(BASE + '/#process-journey');
  await page.waitForTimeout(1100);
  const state = await page.evaluate(() => ({
    href: location.href,
    y: scrollY,
    processTop: document.getElementById('process-journey').offsetTop,
    activated: window.PROCESS_JOURNEY?.activated,
    station: window.PROCESS_JOURNEY?.station
  }));
  check(state.href.endsWith('/#process-journey') && state.y >= state.processTop - 2 && state.activated && state.station === 'arrival', 'standalone Work terminal click lands on homepage Process Arrival');
  report.workTerminalClick = { ...state, framing };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(BASE + '/work/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  report.workMobileFraming = [];
  for (const index of [0, 2, 4]) {
    await page.evaluate(async (target) => { await window.WORK_PASSAGE.goMobileStop(target); }, index);
    await page.waitForTimeout(1150);
    const state = await page.evaluate(() => ({ stop: window.WORK_PASSAGE.mobileStop, geometry: window.WORK_PASSAGE.mobileContainGeometry }));
    const g = state.geometry;
    const ratioError = g ? Math.abs((g.width / g.height) - (g.sourceWidth / g.sourceHeight)) : Infinity;
    const centered = g && Math.abs((g.x * 2 + g.width) - g.plateWidth) < 1.1 && Math.abs((g.y * 2 + g.height) - g.plateHeight) < 1.1;
    const contained = g && g.x >= -.1 && g.y >= -.1 && g.x + g.width <= g.plateWidth + .1 && g.y + g.height <= g.plateHeight + .1;
    check(contained && centered && ratioError < .0001, 'standalone Work mobile ' + state.stop + ' preserves the complete centered source aspect ratio');
    await page.screenshot({ path: path.join(EVIDENCE, 'work-mobile-framing-' + state.stop + '.png') });
    report.workMobileFraming.push(state);
  }
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: EVIDENCE, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const video = page.video();
  const errors = [];
  const requests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1300);

  const cold = await page.evaluate(() => ({
    processActivated: window.PROCESS_JOURNEY?.activated,
    portfolioProgress: window.ROOT_PORTFOLIO_PASSAGE?.progress,
    generationSource: document.getElementById('portfolio-generations-video')?.currentSrc,
    visibleCopy: [...document.querySelectorAll('.portfolio-scene-copy')].filter((el) => Number(getComputedStyle(el).opacity) > .05).map((el) => el.id),
  }));
  check(cold.processActivated === false, 'desktop cold load leaves process inactive');
  check(cold.visibleCopy.length === 1 && cold.visibleCopy[0] === 'portfolio-copy-generations', 'desktop cold load shows only Generations copy');
  const coldResources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource').filter((entry) => /\.(?:mp4|jpe?g|png|webp)(?:$|\?)/i.test(entry.name));
    return { paths: entries.map((entry) => new URL(entry.name).pathname), bytes: entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) };
  });
  const downstreamVideo = /opening-desktop\.mp4|studio-banner\.mp4|ring-alexandrite\.mp4|sakura-ink-bloom\.mp4/;
  check(!coldResources.paths.some((item) => downstreamVideo.test(item)), 'desktop cold load requests no downstream project video');
  check(coldResources.bytes <= 2500000, 'desktop cold media transfer stays within 2.5 MB');

  const desktopFraming = await page.evaluate(() => {
    const ids = [
      'portfolio-generations-poster', 'portfolio-generations-video',
      'portfolio-paina-poster', 'portfolio-paina-video',
      'portfolio-rana-poster', 'portfolio-rana-studio-video',
      'portfolio-ring-poster', 'portfolio-rana-ring-video',
      'portfolio-prorok-poster', 'portfolio-prorok-ink-video',
      'portfolio-prorok-portrait', 'portfolio-terminal-return'
    ];
    return ids.map((id) => {
      const element = document.getElementById(id);
      const style = getComputedStyle(element);
      return { id, objectFit: style.objectFit, objectPosition: style.objectPosition, transform: style.transform };
    });
  });
  check(desktopFraming.every((item) => item.objectFit === 'contain' && item.objectPosition === '50% 50%' && item.transform === 'none'), 'desktop project carriers preserve complete centered source plates');

  const portfolioGeometry = await page.evaluate(() => {
    const passage = document.getElementById('portfolio-passage');
    const viewport = document.getElementById('portfolio-viewport');
    return { top: passage.offsetTop, total: passage.offsetHeight - viewport.offsetHeight };
  });
  const stops = [['generations', .04], ['paina', .26], ['rana', .566], ['prorok', .79], ['process', .958]];
  const forward = [];
  for (let i = 0; i <= 150; i++) {
    const y = portfolioGeometry.top + portfolioGeometry.total * (i / 150);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(24);
  }
  for (const [name, progress] of stops) {
    await page.evaluate((top) => window.scrollTo(0, top), portfolioGeometry.top + portfolioGeometry.total * progress);
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({
      progress: window.ROOT_PORTFOLIO_PASSAGE.progress,
      visibleCopy: [...document.querySelectorAll('.portfolio-scene-copy')].filter((el) => Number(getComputedStyle(el).opacity) > .05).map((el) => el.id),
      focusable: [...document.querySelectorAll('.portfolio-scene-copy a')].filter((el) => el.tabIndex >= 0).map((el) => el.closest('.portfolio-scene-copy')?.id),
    }));
    await page.screenshot({ path: path.join(EVIDENCE, 'root-desktop-' + name + '.png') });
    check(state.visibleCopy.length === 1, 'desktop ' + name + ' rest shows one copy block');
    check(new Set(state.focusable).size === 1 && state.focusable[0] === state.visibleCopy[0], 'desktop ' + name + ' rest focus follows visible copy');
    forward.push({ name, ...state });
  }

  const processTop = await page.evaluate(() => document.getElementById('process-journey').offsetTop);
  await page.evaluate((top) => window.scrollTo(0, top + 20), processTop);
  await page.waitForTimeout(1500);
  const processStart = await page.evaluate(() => ({
    activated: window.PROCESS_JOURNEY?.activated,
    progress: window.PROCESS_JOURNEY?.progress,
    station: window.PROCESS_JOURNEY?.station,
    frame: window.PROCESS_JOURNEY?.frame,
    currentSrc: document.getElementById('process-arrival-motion-video')?.currentSrc,
  }));
  check(processStart.activated === true && processStart.station === 'arrival', 'desktop natural handoff activates Process at Arrival');
  check(processStart.frame >= 0, 'desktop Process handoff keeps a complete frame');
  const beforeKey = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(800);
  const afterKey = await page.evaluate(() => window.scrollY);
  check(afterKey >= processTop && beforeKey >= processTop, 'portfolio keyboard handler does not pull Process back into Work');

  const sharedMotion = await page.evaluate(() => ({
    portfolio: window.ROOT_PORTFOLIO_PASSAGE.motion,
    process: window.PROCESS_JOURNEY.motion,
    root: document.documentElement.getAttribute('data-motion'),
    controls: document.querySelectorAll('#portfolio-motion-toggle,#process-motion-toggle').length,
  }));
  check(
    sharedMotion.portfolio === true && sharedMotion.process === true && sharedMotion.root === 'on' && sharedMotion.controls === 0,
    'desktop defaults both controllers on without rendering motion toggles'
  );

  const processGeometry = await page.evaluate(() => {
    const journey = document.getElementById('process-journey');
    const viewport = document.getElementById('process-viewport');
    return { top: journey.offsetTop, total: journey.offsetHeight - viewport.offsetHeight };
  });
  for (let i = 0; i <= 170; i++) {
    const y = processGeometry.top + processGeometry.total * (i / 170);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(24);
  }
  await page.waitForTimeout(1600);
  const processEnd = await page.evaluate(() => ({ progress: window.PROCESS_JOURNEY.progress, station: window.PROCESS_JOURNEY.station, frame: window.PROCESS_JOURNEY.frame }));
  check(processEnd.progress > .96 && processEnd.station === 'threshold', 'desktop continuous forward walk reaches final contact');
  await page.screenshot({ path: path.join(EVIDENCE, 'root-desktop-final-contact.png') });

  for (let i = 170; i >= 0; i--) {
    const y = processGeometry.top + processGeometry.total * (i / 170);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(16);
  }
  for (let i = 150; i >= 0; i--) {
    const y = portfolioGeometry.top + portfolioGeometry.total * (i / 150);
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(900);
  const reverse = await page.evaluate(() => ({
    y: window.scrollY,
    progress: window.ROOT_PORTFOLIO_PASSAGE.progress,
    processPaused: document.getElementById('process-arrival-motion-video').paused,
    visibleCopy: [...document.querySelectorAll('.portfolio-scene-copy')].filter((el) => Number(getComputedStyle(el).opacity) > .05).map((el) => el.id),
  }));
  check(reverse.y < 2 && reverse.progress < .02 && reverse.processPaused, 'desktop reverse walk returns to cold Generations and pauses Process');
  check(errors.length === 0, 'desktop continuous root walk has no browser errors');
  report.root = { cold, coldResources, desktopFraming, forward, processStart, processEnd, reverse, errors, requestCount: requests.length };
  await page.close();
  const generatedVideo = await video.path();
  const finalVideo = path.join(EVIDENCE, 'root-continuous-desktop.webm');
  fs.copyFileSync(generatedVideo, finalVideo);
  report.root.recording = finalVideo;
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  const coldResources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource').filter((entry) => /\.(?:mp4|jpe?g|png|webp)(?:$|\?)/i.test(entry.name));
    return { paths: entries.map((entry) => new URL(entry.name).pathname), bytes: entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) };
  });
  const downstreamVideo = /opening-mobile-from-2p4\.mp4|studio-banner\.mp4|ring-alexandrite\.mp4|sakura-ink-bloom\.mp4/;
  check(!coldResources.paths.some((item) => downstreamVideo.test(item)), 'mobile cold load requests no downstream project video');
  check(coldResources.bytes <= 1400000, 'mobile cold media transfer stays within 1.4 MB');
  const stops = [];
  for (let i = 0; i < 5; i++) {
    await page.evaluate(async (index) => { await window.ROOT_PORTFOLIO_PASSAGE.goMobileStop(index); }, i);
    await page.waitForTimeout(1150);
    const state = await page.evaluate(() => ({
      stop: window.ROOT_PORTFOLIO_PASSAGE.mobileStop,
      waiting: window.ROOT_PORTFOLIO_PASSAGE.mobileWaiting,
      gliding: window.ROOT_PORTFOLIO_PASSAGE.mobileGliding,
      plateActive: window.ROOT_PORTFOLIO_PASSAGE.mobilePlateActive,
      plate: window.ROOT_PORTFOLIO_PASSAGE.mobilePlateSize,
      contain: window.ROOT_PORTFOLIO_PASSAGE.mobileContainGeometry,
      visibleCopy: [...document.querySelectorAll('.portfolio-scene-copy')].filter((el) => Number(getComputedStyle(el).opacity) > .05).map((el) => el.id),
    }));
    await page.screenshot({ path: path.join(EVIDENCE, 'root-mobile-' + state.stop + '.png') });
    check(state.plateActive && state.plate.width >= 390 && state.plate.height >= 844, 'mobile ' + state.stop + ' uses one complete opaque plate');
    check(state.visibleCopy.length === 1, 'mobile ' + state.stop + ' shows one copy block');
    check(state.stop === ['generations', 'paina', 'rana', 'prorok', 'process'][i], 'mobile passage lands on requested ' + ['generations', 'paina', 'rana', 'prorok', 'process'][i] + ' rest');
    const g = state.contain;
    const ratioError = g ? Math.abs((g.width / g.height) - (g.sourceWidth / g.sourceHeight)) : Infinity;
    const centered = g && Math.abs((g.x * 2 + g.width) - g.plateWidth) < 1.1 && Math.abs((g.y * 2 + g.height) - g.plateHeight) < 1.1;
    const contained = g && g.x >= -.1 && g.y >= -.1 && g.x + g.width <= g.plateWidth + .1 && g.y + g.height <= g.plateHeight + .1;
    check(contained && centered && ratioError < .0001, 'mobile ' + state.stop + ' preserves the complete centered source aspect ratio');
    stops.push(state);
  }
  const processTop = await page.evaluate(() => document.getElementById('process-journey').offsetTop);
  await touchSwipe(page, 720, 120);
  await page.waitForTimeout(1400);
  const processTouch = await page.evaluate(() => ({ activated: window.PROCESS_JOURNEY.activated, stage: window.PROCESS_JOURNEY.mobileStage, y: window.scrollY }));
  check(processTouch.activated && processTouch.stage === 'arrival' && processTouch.y >= processTop - 2, 'real touch from portfolio terminal reaches Process Arrival');
  await touchSwipe(page, 120, 720);
  await page.waitForTimeout(1300);
  const touchReverse = await page.evaluate(() => ({ y: window.scrollY, stop: window.ROOT_PORTFOLIO_PASSAGE.mobileStop }));
  check(touchReverse.y < processTop && touchReverse.stop === 'process', 'real reverse touch from Process Arrival restores the portfolio terminal');
  await page.mouse.wheel(0, 640);
  await page.waitForTimeout(1400);
  const processWheel = await page.evaluate(() => ({ activated: window.PROCESS_JOURNEY.activated, stage: window.PROCESS_JOURNEY.mobileStage, y: window.scrollY }));
  check(processWheel.activated && processWheel.stage === 'arrival' && processWheel.y >= processTop - 2, 'real wheel from portfolio terminal reaches Process Arrival');
  await page.evaluate(() => window.PROCESS_JOURNEY.goMobileStage(8, false));
  await page.waitForTimeout(1300);
  const final = await page.evaluate(() => ({ stage: window.PROCESS_JOURNEY.mobileStage, station: window.PROCESS_JOURNEY.station, y: window.scrollY }));
  check(final.stage === 'services' && final.y >= processTop, 'mobile Process reaches Services without offset loss');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1100);
  const reverse = await page.evaluate(() => ({ stop: window.ROOT_PORTFOLIO_PASSAGE.mobileStop, processPaused: document.getElementById('process-arrival-motion-video').paused }));
  check(reverse.stop === 'generations' && reverse.processPaused, 'mobile reverse returns to Generations and pauses Process');
  check(errors.length === 0, 'mobile root walk has no browser errors');
  report.mobile = { coldResources, stops, processTouch, touchReverse, processWheel, final, reverse, errors };
  await context.close();
}

{
  const scenarios = [
    { name: 'default-on', query: '', reducedMotion: 'no-preference', expected: 'on' },
    { name: 'os-reduce', query: '', reducedMotion: 'reduce', expected: 'off' },
    { name: 'query-off', query: '?motion=off', reducedMotion: 'no-preference', expected: 'off' },
  ];
  report.caseMotion = [];
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: scenario.reducedMotion });
    const page = await context.newPage();
    await page.goto(BASE + '/work/rana-levy/' + scenario.query, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const state = await page.evaluate(() => ({
      motion: document.documentElement.getAttribute('data-motion'),
      source: document.documentElement.getAttribute('data-motion-source'),
      mode: document.documentElement.getAttribute('data-case-motion'),
      allPaused: [...document.querySelectorAll('video')].every((video) => video.paused),
      allHidden: [...document.querySelectorAll('video')].every((video) => getComputedStyle(video).visibility === 'hidden'),
      controls: document.querySelectorAll('.case-motion-toggle').length,
    }));
    const on = scenario.expected === 'on';
    check(state.motion === scenario.expected && state.mode === scenario.expected, 'case route ' + scenario.name + ' follows the shared motion owner');
    check(state.controls === 0, 'case route ' + scenario.name + ' renders no motion control');
    if (!on) check(state.allPaused && state.allHidden, 'case route ' + scenario.name + ' shows the still composition with videos paused');
    report.caseMotion.push({ scenario, state });
    await context.close();
  }
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto(BASE + '/?identity=off', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => ({
    identity: document.documentElement.getAttribute('data-portfolio-identity'),
    copiesHidden: [...document.querySelectorAll('.portfolio-scene-copy')].every((el) => getComputedStyle(el).display === 'none'),
    worldSize: (() => { const r = document.querySelector('.portfolio-layer-generations').getBoundingClientRect(); return { width: r.width, height: r.height }; })(),
  }));
  check(state.identity === 'off' && state.copiesHidden && state.worldSize.width === 1280 && state.worldSize.height === 720, 'identity-off removes copy while the full-screen world remains');
  await page.screenshot({ path: path.join(EVIDENCE, 'root-desktop-identity-off.png') });
  report.identityOff = state;
  await context.close();
}

fs.writeFileSync(path.join(EVIDENCE, 'browser-release-report.json'), JSON.stringify(report, null, 2));
await browser.close();
if (preview) await preview.close();

if (failures.length) {
  console.error('\nBROWSER FAIL ' + failures.length);
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log('\nBROWSER RELEASE PASS');
