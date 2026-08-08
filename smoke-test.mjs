#!/usr/bin/env node
/**
 * Local smoke test for THE GOLDEN ARRIVAL candidate.
 * Filesystem + HTML assertions (no network bind — buildsecure blocks listen).
 * Covers: normal route bytes, five ?station= seams in markup/tuning,
 * motion-off default path, unknown station fallback logic, frames 000/180/360,
 * and required local sources.
 *
 * Compounding residue — holistic visual-correction layout tripwires
 * Future consumer: Codex re-render / independent Opus visual review of this candidate
 * Activation: execute — `node jarrettwroten-site/smoke-test.mjs`
 * Behavioral check: asserts nowrap display, no wbr, Proof housing/spill, loader
 *   opening-neighbourhood, railCenters mapping, faceExclusionMobile, five distinct
 *   stationCarriers, footer zero-margin, mobile full-width person-station wash,
 *   mobile proof note right-anchor, mobile footer elevated above distance HUD,
 *   and frozen proof figures without remote runtime
 * Retirement: retire when the page no longer uses the five-station Golden Arrival
 *   layout contract, or when a stronger live-pixel harness supersedes these structural
 *   tripwires for the same failure class
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
function ok(cond, msg) {
  if (!cond) failures.push(msg);
  else console.log('OK', msg);
}
function mustExist(rel) {
  const p = path.join(ROOT, rel);
  const ex = fs.existsSync(p);
  ok(ex, 'exists ' + rel);
  return ex ? fs.readFileSync(p) : null;
}

const htmlBuf = mustExist('index.html');
const html = htmlBuf ? htmlBuf.toString('utf8') : '';

ok(html.includes('data-station="leak"'), 'normal route has leak station');
ok(html.includes('I FIND WHERE') || html.includes('I find where'), 'leak copy present');

for (const s of ['leak', 'method', 'proof', 'jarrett', 'threshold']) {
  ok(html.includes('data-station="' + s + '"'), '?station=' + s + ' target markup');
  ok(html.includes('data-go="' + s + '"') || html.includes("'" + s + "'"), 'station seam ' + s);
}

ok(html.includes('jw-motion'), 'motion preference key');
ok(html.includes('MOTION ON') || html.includes('motion-toggle'), 'motion control');
ok(html.includes('data-motion'), 'motion attribute boot');
ok(html.includes('motion=off') || html.includes("get(\"motion\")") || html.includes("params.get(\"motion\")"), 'motion query support');

// unknown station fallback: validStations map + empty invalid
ok(html.includes('validStations'), 'unknown station fallback map');
ok(html.includes('stationParam') || html.includes('forcedStation'), 'station param handling');

// frames
for (const i of ['000', '180', '360']) {
  const b = mustExist(path.join('assets/golden-arrival/frames', 'ga-' + i + '.webp'));
  if (b) {
    ok(b.length > 1000, 'frame ga-' + i + ' bytes ' + b.length);
    ok(b.slice(0, 4).toString() === 'RIFF', 'frame ga-' + i + ' RIFF');
    ok(b.slice(8, 12).toString() === 'WEBP', 'frame ga-' + i + ' WEBP');
  }
}

// contiguous sample + count
let missing = 0;
for (let i = 0; i < 361; i++) {
  const name = 'ga-' + String(i).padStart(3, '0') + '.webp';
  if (!fs.existsSync(path.join(ROOT, 'assets/golden-arrival/frames', name))) missing++;
}
ok(missing === 0, 'all 361 frames present');

// local sources
for (const rel of [
  'assets/stripe-growth-focal.png',
  'image000001.jpg',
  'image0000002.jpg',
  'assets/fonts/bodoni-moda-latin-variable.woff2',
  'assets/fonts/ibm-plex-mono-latin-500.woff2',
  'assets/golden-arrival/golden-arrival-approved.mp4',
  'assets/golden-arrival/frames.json',
]) {
  mustExist(rel);
}

// frames.json — corrected continuous-source contract (reject 15-hold recurrence)
const fj = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/golden-arrival/frames.json'), 'utf8'));
ok(fj.count === 361, 'frames.json count 361');
ok(fj.width === 1280 && fj.height === 720, 'frames.json dimensions');
ok(fj.unique_frame_files === 361, 'frames.json unique_frame_files 361');
ok(fj.aggregate_bytes === 28257098, 'frames.json aggregate_bytes 28257098');
ok(
  !fj.review_anchor_indices_0based &&
    !(fj.extraction && String(fj.extraction.method || '').includes('nearest-hold')),
  'frames.json has no nearest-hold / review-anchor workaround'
);
const enc = fj.encoding;
const encOk =
  enc &&
  typeof enc === 'object' &&
  enc.codec === 'libwebp' &&
  enc.quality === 82 &&
  enc.compression_level === 6;
ok(encOk, 'frames.json encoding is source-derived libwebp q82 c6');

// no remote script/src runtime
ok(!/src=["']https?:\/\//i.test(html), 'no remote script src');
ok(!/href=["']https?:\/\/cdn\./i.test(html), 'no cdn href');

// proof figures selectable in markup
for (const v of ['40,114.81', '104.51%', '37,914.00', '108.02%', 'AND THE MORNING PAYROLL CLEARED']) {
  ok(html.includes(v), 'proof text ' + v);
}

// SITE_TUNING exported
ok(html.includes('window.SITE_TUNING'), 'SITE_TUNING inspectable');
ok(html.includes('frameMap'), 'nonlinear frameMap');
ok(html.includes('requestIdleCallback') || html.includes('preloadBatch'), 'idle batch preload');
ok(html.includes('.decode(') || html.includes('img.decode'), 'img.decode gate');

// ——— Atomic frame presentation (anti-flicker tripwire) ———
// Regression class: single live <img> src mutation exposes --void between ready frames.
ok(html.includes('id="world-frame-a"') && html.includes('id="world-frame-b"'), 'double-buffer world-frame elements');
ok((html.match(/class="world-frame(?:\s+is-active)?"/g) || []).length >= 2, 'two world-frame buffers in markup');
ok(html.includes('frameBuffers') && html.includes('activeBufferIndex'), 'buffer presentation state');
ok(html.includes('presentGeneration') && html.includes('commitBuffer'), 'generation-guarded atomic commit');
ok(html.includes('presentOnBuffer'), 'inactive-buffer present path');
ok(html.includes('.world-frame.is-active'), 'active buffer stacking rule');
ok(!html.includes('id="world-frame"'), 'no single world-frame id');
ok(
  !/worldFrame\.src\s*=/.test(html) &&
    !/getAttribute\("src"\)\s*!==\s*url\s*\)\s*\{\s*worldFrame\.src/.test(html),
  'unsafe single-live-src swap removed'
);
ok(
  /if\s*\(\s*bufferSrc\(\s*next\s*\)\s*!==\s*url\s*\)\s*\{\s*next\.src\s*=\s*url/.test(html) ||
    html.includes('next.src = url'),
  'src assigned only on inactive/next buffer'
);
ok(html.includes('Hold the last good active frame') || html.includes('never clear the world'), 'missing-frame hold contract');
// Pending-presentation reuse: same desired frame must not bump generation / cancel commit.
ok(html.includes('pendingPresent'), 'pending presentation state tracked');
ok(html.includes('clearPendingPresent'), 'pending presentation cleared on commit');
ok(
  html.includes('pendingPresent.show === show') &&
    html.includes('pendingPresent.nextIndex === nextIndex') &&
    html.includes('pendingPresent.url === url'),
  'same-pending-frame reuse guard'
);
ok(
  html.includes('Do not bump generation') ||
    html.includes('reuse in-flight present') ||
    html.includes('Same pending target'),
  'same-pending starvation comment contract'
);

// ——— Holistic visual-correction contract (structural tripwires) ———
ok(html.includes('white-space:nowrap'), 'display spans authored nowrap');
ok(!/text-wrap\s*:\s*balance/.test(html), 'no text-wrap:balance on display');
ok(!html.includes('<wbr>'), 'threshold email has no wbr');
ok(html.includes('Jarrett@JarrettWroten.com'), 'one-line email address');
ok(html.includes('console-housing'), 'proof housing resolved');
ok(html.includes('console-spill'), 'proof spill present');
ok(html.includes('console-housing::before') || html.includes('.console-housing::before'), 'proof mounting lugs');
ok(html.includes('perspective:1400px') || html.includes('perspective: 1400px'), 'proof perspective');
ok(html.includes('rotateY(-4deg)'), 'proof rotateY');
ok(html.includes('note-device-caption'), 'note caption under device');
ok(html.includes('proof-open-hint'), 'mobile tap affordance markup');
ok(!/\.proof-open-hint\s*\{\s*display\s*:\s*none/.test(html), 'proof-open-hint not hard-hidden at mobile');
ok(html.includes('loaderOpeningFrames'), 'loader opening-neighbourhood contract');
ok(html.includes('progressToRailMarker'), 'rail marker station-center mapping');
ok(html.includes('railCenters'), 'rail centers inspectable');
ok(html.includes('faceExclusionMobile'), 'face exclusion geometry inspectable');
ok(html.includes('support-extra'), 'jarrett extra copy preserved in document');
ok(html.includes('support-primary'), 'jarrett primary support marked');
// Width-aware: longest Jarrett display line must fit inside masked .line (scrollWidth)
ok(
  html.includes('max-width:min(38rem, 48vw)') ||
    html.includes('max-width: min(38rem, 48vw)'),
  'jarrett desktop claim column fits longest display line'
);
ok(
  html.includes('max-width:min(21rem, 90vw)') ||
    html.includes('max-width: min(21rem, 90vw)'),
  'jarrett mobile claim column fits longest display line'
);
ok(html.includes('threshold-top') && html.includes('threshold-bottom'), 'threshold separated carrier groups');
ok(html.includes('stationCarriers'), 'distinct station carrier map');
ok(html.includes('bottom:clamp(6rem,16vh,9rem)') || html.includes('bottom:clamp(6rem, 16vh, 9rem)'), 'method heading bottom-anchored desktop');
ok(html.includes('left:10%; top:44%') || html.includes('left:10%;top:44%'), 'method annot 1 desktop depth position');
ok(html.includes('left:48%; top:25%') || html.includes('left:48%;top:25%'), 'method annot 3 desktop depth position');
ok(html.includes('left:6%; top:20%') || html.includes('left:6%;top:20%'), 'method annot 1 mobile clear of headline');
ok(html.includes('top:34%') && html.includes('console-mount'), 'console lifted to 34% desktop');
ok(html.includes('is-done'), 'loader dismiss class');
ok(html.includes('displayScale'), 'two-peak display scale contract');
ok(html.includes('leak: 72') || html.includes('leak:72'), 'leak desktop peak 72');
ok(html.includes('threshold: 72') || html.includes('threshold:72'), 'threshold desktop peak 72');
ok(html.includes('Jarrett Wroten · Las Vegas'), 'footer one-line mark');
ok(/\.site-footer\s+p\s*\{\s*margin\s*:\s*0/.test(html) || html.includes('.site-footer p{margin:0}'), 'footer p zero margin');
ok(html.includes('linear-gradient(100deg, rgba(4,10,12,.90)'), 'leak/method directional scrim');
ok(
  html.includes('station[data-station="jarrett"]::after') &&
    html.includes('station[data-station="threshold"]::after') &&
    html.includes('rgba(4,10,12,.96)') &&
    html.includes('transparent 100%'),
  'mobile person-station full-width bottom wash'
);
ok(
  html.includes('right:calc(var(--gutter) + 1rem)') ||
    html.includes('right:calc(var(--gutter)+1rem)'),
  'mobile proof note right-anchored inside gutter'
);
ok(
  html.includes('bottom:clamp(2.2rem,4.8vh,2.75rem)') ||
    html.includes('bottom:clamp(2.2rem, 4.8vh, 2.75rem)'),
  'mobile footer elevated above distance HUD'
);
ok(html.includes('dismissLoader'), 'loader dismiss after intro');
ok(html.includes('openingNeighborhoodReady'), 'loader driven by opening frames');
// Stripe crop path unchanged; no filter/tint on evidence img
ok(html.includes('assets/stripe-growth-focal.png'), 'stripe crop path present');
ok(!/stripe-growth-focal[^"']*["'][^>]*style=/i.test(html), 'no inline style on stripe crop');
// No remote runtime
ok(!/fonts\.googleapis|cdn\.jsdelivr|unpkg\.com|cloudflare/i.test(html), 'no remote font/cdn runtime');
// Distinct carrier tokens for five stations
for (const c of [
  'top-left-type-wall-cta',
  'bottom-left-heading-annotations-up-right',
  'centered-instrument-axial',
  'high-left-claim-low-left-support',
  'high-left-ask-low-left-email',
]) {
  ok(html.includes(c), 'carrier token ' + c);
}

// Parse every inline script
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
ok(scripts.length >= 2, 'inline scripts present (' + scripts.length + ')');
for (let i = 0; i < scripts.length; i++) {
  const body = scripts[i][1].trim();
  if (!body) continue;
  try {
    // eslint-disable-next-line no-new-func
    new Function(body);
    ok(true, 'inline script ' + (i + 1) + ' parses');
  } catch (e) {
    ok(false, 'inline script ' + (i + 1) + ' parse: ' + e.message);
  }
}

// Behavioral oracle for the atomic double-buffer seam (no browser in this harness).
// Models the same commit rules: never clear the active painted buffer; swap only after
// the inactive buffer is paint-ready; missing/slow loads hold the last good frame;
// same pending frame reuses in-flight present instead of generation thrashing.
function makeBuf(src, initiallyActive) {
  const buf = {
    srcAttr: src || '',
    complete: !!src,
    naturalWidth: src ? 1280 : 0,
    classes: new Set(initiallyActive ? ['is-active'] : []),
    getAttribute(name) { return name === 'src' ? this.srcAttr : null; },
    decode() { return Promise.resolve(); },
    onload: null,
    onerror: null,
    loadDelayMs: 0,
    set src(url) {
      this.srcAttr = url;
      // Simulate async load; callers must not treat as active until complete.
      this.complete = false;
      this.naturalWidth = 0;
      const settle = () => {
        this.complete = true;
        this.naturalWidth = 1280;
        if (typeof this.onload === 'function') this.onload();
      };
      if (this.loadDelayMs > 0) {
        setTimeout(settle, this.loadDelayMs);
      } else {
        queueMicrotask(settle);
      }
    },
    get src() { return this.srcAttr; }
  };
  buf.classList = {
    add: (c) => buf.classes.add(c),
    remove: (c) => buf.classes.delete(c),
    contains: (c) => buf.classes.has(c)
  };
  return buf;
}

const bufA = makeBuf('assets/golden-arrival/frames/ga-000.webp', true);
const bufB = makeBuf('', false);
const frameBuffers = [bufA, bufB];
let activeBufferIndex = 0;
let presentGeneration = 0;
let pendingPresent = null;
let displayedFrame = 0;
let desiredFrame = 0;
const readySet = Object.create(null);
for (let i = 0; i < 361; i++) readySet[i] = 1;

function frameUrl(i) {
  const s = String(i).padStart(3, '0');
  return 'assets/golden-arrival/frames/ga-' + s + '.webp';
}
function bufferSrc(el) { return el ? el.getAttribute('src') || '' : ''; }
function bufferPaintReady(el) {
  return !!(el && bufferSrc(el) && el.complete && el.naturalWidth > 0);
}
function nearestReadyFrame(target) {
  if (readySet[target]) return target;
  let best = -1;
  let bestD = 1e9;
  for (const k of Object.keys(readySet)) {
    if (!readySet[k]) continue;
    const idx = k | 0;
    const d = Math.abs(idx - target);
    if (d < bestD) { bestD = d; best = idx; }
  }
  return best >= 0 ? best : 0;
}
function clearPendingPresent(generation) {
  if (!pendingPresent) return;
  if (generation == null || pendingPresent.generation === generation) pendingPresent = null;
}
function commitBuffer(nextIndex, show, generation) {
  if (generation !== presentGeneration) return;
  if (nearestReadyFrame(desiredFrame) !== show) return;
  const next = frameBuffers[nextIndex];
  const prev = frameBuffers[activeBufferIndex];
  if (!next || !bufferPaintReady(next)) return;
  if (nextIndex !== activeBufferIndex) {
    next.classList.add('is-active');
    if (prev) prev.classList.remove('is-active');
    activeBufferIndex = nextIndex;
  }
  displayedFrame = show;
  clearPendingPresent(generation);
}
function presentOnBuffer(nextIndex, show, url, generation) {
  const next = frameBuffers[nextIndex];
  if (!next) return;
  const finish = () => {
    if (generation !== presentGeneration) return;
    if (nearestReadyFrame(desiredFrame) !== show) return;
    if (!bufferPaintReady(next) || bufferSrc(next) !== url) return;
    commitBuffer(nextIndex, show, generation);
  };
  if (bufferSrc(next) === url && bufferPaintReady(next)) {
    finish();
    return;
  }
  next.onload = () => {
    if (generation !== presentGeneration) return;
    finish();
  };
  if (bufferSrc(next) !== url) {
    next.src = url;
    if (bufferPaintReady(next)) finish();
  } else if (next.complete) {
    finish();
  }
}
function showFrame(target) {
  desiredFrame = Math.max(0, Math.min(360, target | 0));
  const show = nearestReadyFrame(desiredFrame);
  if (show === displayedFrame) {
    clearPendingPresent();
    return;
  }
  const url = frameUrl(show);
  const active = frameBuffers[activeBufferIndex];
  if (active && bufferSrc(active) === url && bufferPaintReady(active)) {
    displayedFrame = show;
    clearPendingPresent();
    return;
  }
  const nextIndex = active && bufferPaintReady(active) ? 1 - activeBufferIndex : activeBufferIndex;
  if (
    pendingPresent &&
    pendingPresent.show === show &&
    pendingPresent.nextIndex === nextIndex &&
    pendingPresent.url === url
  ) {
    const pendingBuf = frameBuffers[nextIndex];
    if (pendingBuf && bufferPaintReady(pendingBuf) && bufferSrc(pendingBuf) === url) {
      commitBuffer(nextIndex, show, pendingPresent.generation);
    }
    return;
  }
  const generation = ++presentGeneration;
  pendingPresent = { show, nextIndex, url, generation };
  presentOnBuffer(nextIndex, show, url, generation);
}
function activePainted() {
  return bufferPaintReady(frameBuffers[activeBufferIndex]);
}

let blankEvents = 0;
let srcMutationsOnActive = 0;
for (let f = 0; f <= 120; f++) {
  const beforeActive = frameBuffers[activeBufferIndex];
  const beforeSrc = bufferSrc(beforeActive);
  const beforeReady = bufferPaintReady(beforeActive);
  showFrame(f);
  // Immediately after request (before microtask decode), active must still be painted.
  if (!activePainted()) blankEvents++;
  if (beforeReady && !bufferPaintReady(beforeActive) && beforeSrc) blankEvents++;
  if (beforeReady && frameBuffers[activeBufferIndex] === beforeActive && bufferSrc(beforeActive) !== beforeSrc) {
    srcMutationsOnActive++;
  }
}

await Promise.resolve();
await Promise.resolve();

for (let f = 121; f <= 360; f++) {
  const beforeActive = frameBuffers[activeBufferIndex];
  const beforeSrc = bufferSrc(beforeActive);
  showFrame(f);
  if (!activePainted()) blankEvents++;
  if (frameBuffers[activeBufferIndex] === beforeActive && bufferSrc(beforeActive) !== beforeSrc && beforeSrc) {
    srcMutationsOnActive++;
  }
}

await Promise.resolve();
await Promise.resolve();

// Hold contract: drop readiness for one index; nearestReady must not blank the world.
delete readySet[200];
const held = displayedFrame;
showFrame(200);
ok(activePainted(), 'oracle: active buffer stays painted after missing frame');
ok(displayedFrame !== 200 || activePainted(), 'oracle: missing frame does not force blank display');
ok(held >= 0 && activePainted(), 'oracle: last good frame held through gap (was ' + held + ', now ' + displayedFrame + ')');

ok(blankEvents === 0, 'oracle: zero blank active-buffer events during rapid advance (' + blankEvents + ')');
ok(srcMutationsOnActive === 0, 'oracle: zero live active-buffer src mutations (' + srcMutationsOnActive + ')');
ok(activePainted(), 'oracle: final active buffer paint-ready');
ok(displayedFrame >= 0, 'oracle: displayedFrame remains defined');

for (const still of [0, 72, 180, 288, 360]) {
  showFrame(still);
}
await Promise.resolve();
await Promise.resolve();
ok(activePainted(), 'oracle: still-frame jumps leave active painted');
const activeCount = frameBuffers.filter((b) => b.classes.has('is-active')).length;
ok(activeCount === 1, 'oracle: single is-active buffer (' + activeCount + ')');

// ——— Same-pending-frame starvation oracle (direct ?station= route class) ———
// Reset to frame 0 painted; request a station still repeatedly while the inactive
// buffer load is delayed. Generation must not thrash; commit must win once ready.
{
  const stationStills = { leak: 24, method: 120, proof: 181, jarrett: 294, threshold: 354 };
  // Force a clean painted A at 0
  bufA.srcAttr = frameUrl(0);
  bufA.complete = true;
  bufA.naturalWidth = 1280;
  bufA.classes = new Set(['is-active']);
  bufB.srcAttr = '';
  bufB.complete = false;
  bufB.naturalWidth = 0;
  bufB.classes = new Set();
  bufB.loadDelayMs = 40;
  activeBufferIndex = 0;
  presentGeneration = 0;
  pendingPresent = null;
  displayedFrame = 0;
  desiredFrame = 0;
  for (let i = 0; i < 361; i++) readySet[i] = 1;

  const genBefore = presentGeneration;
  const target = stationStills.jarrett;
  const genAtStart = presentGeneration;
  // Burst of identical showFrame calls — models rAF + markReady re-entry during route settle
  for (let n = 0; n < 60; n++) showFrame(target);
  const genAfterBurst = presentGeneration;
  ok(
    genAfterBurst === genAtStart + 1,
    'oracle: same-pending jarrett burst bumps generation once (got ' + (genAfterBurst - genAtStart) + ')'
  );
  ok(pendingPresent && pendingPresent.show === target, 'oracle: pending present retained for jarrett');
  ok(activePainted() && displayedFrame === 0, 'oracle: holds frame 0 while jarrett pending');
  ok(bufferSrc(frameBuffers[1 - activeBufferIndex]) === frameUrl(target), 'oracle: inactive buffer loading jarrett');

  await new Promise((r) => setTimeout(r, 80));
  // One more re-entry after load settles (markReady-style)
  showFrame(target);
  ok(displayedFrame === target, 'oracle: jarrett commits after pending load (got ' + displayedFrame + ')');
  ok(activePainted(), 'oracle: jarrett commit leaves active paint-ready');
  ok(!pendingPresent, 'oracle: pending cleared after jarrett commit');

  // Newer desired frame must still supersede
  bufB.loadDelayMs = 40;
  const nextTarget = stationStills.threshold;
  const genPreSuper = presentGeneration;
  showFrame(nextTarget);
  for (let n = 0; n < 30; n++) showFrame(nextTarget);
  ok(
    presentGeneration === genPreSuper + 1,
    'oracle: supersede to threshold bumps generation once (got ' + (presentGeneration - genPreSuper) + ')'
  );
  ok(pendingPresent && pendingPresent.show === nextTarget, 'oracle: pending superseded to threshold');
  // Mid-flight change to a third target must supersede again
  const third = stationStills.proof;
  showFrame(third);
  ok(pendingPresent && pendingPresent.show === third, 'oracle: newer desired frame supersedes pending');
  ok(presentGeneration === genPreSuper + 2, 'oracle: third target advances generation');
  await new Promise((r) => setTimeout(r, 80));
  showFrame(third);
  ok(displayedFrame === third, 'oracle: superseded proof commits (got ' + displayedFrame + ')');
  ok(activePainted(), 'oracle: supersede path keeps active painted');

  // All five station stills under repeated re-entry settle without blanking
  bufB.loadDelayMs = 0;
  bufA.loadDelayMs = 0;
  for (const [name, still] of Object.entries(stationStills)) {
    for (let n = 0; n < 25; n++) showFrame(still);
    await Promise.resolve();
    await Promise.resolve();
    ok(displayedFrame === still, 'oracle: station ' + name + ' settles to frame ' + still + ' (got ' + displayedFrame + ')');
    ok(activePainted(), 'oracle: station ' + name + ' active remains painted');
  }
  void genBefore;
}

if (failures.length) {
  console.error('FAILURES:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('SMOKE PASS');
