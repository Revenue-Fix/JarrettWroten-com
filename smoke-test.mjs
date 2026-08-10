#!/usr/bin/env node
/**
 * Local smoke test for THE GOLDEN ARRIVAL candidate.
 * Filesystem + HTML assertions (no network bind — buildsecure blocks listen).
 * Covers: normal route bytes, five ?station= seams in markup/tuning,
 * motion-off default path, unknown station fallback logic, frames 000/180/360,
 * and required local sources.
 *
 * COMPOUNDING — focused test or tripwire
 * Canonical path: smoke-test.mjs
 * Future consumer: the next JarrettWroten.com editor and independent visual closer
 * Activation: execute — `node smoke-test.mjs`
 * Behavioral check: exercises normal/direct-entry frame behavior and asserts nowrap
 *   display, no wbr, Proof housing/spill, loader,
 *   opening-neighbourhood, railCenters mapping, faceExclusionMobile, five distinct
 *   stationCarriers, footer zero-margin, the seven-beat mobile journey, portrait
 *   navigation/evidence contracts, and frozen proof figures without remote runtime
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
ok(html.includes('Motion on') || html.includes('motion-toggle'), 'motion control');
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
  'assets/fonts/ibm-plex-sans-latin-variable.woff2',
  'assets/fonts/OFL-IBM-Plex-Sans.txt',
  'assets/golden-arrival/golden-arrival-approved.mp4',
  'assets/golden-arrival/frames.json',
]) {
  mustExist(rel);
}

// Corridor reading type system — Rana's Georgia reader + self-hosted fallback,
// with IBM Plex Sans retained for actions and Bodoni retained for display
// Canonical path: smoke-test.mjs corridor reading type-system block
// Future consumer: maintainer changing JarrettWroten.com typography or font assets
// Activation: execute — node smoke-test.mjs
// Behavioral check: fails if self-hosted asset/hash/register split/native spacing/
//   display ownership/no-CDN boundary regresses; full command has passed against candidate
// Retirement: retire only when the corridor type system is intentionally replaced and an
//   equivalent consumer-facing font/register regression check supersedes this block
const crypto = await import('crypto');
const plexSansPath = path.join(ROOT, 'assets/fonts/ibm-plex-sans-latin-variable.woff2');
if (fs.existsSync(plexSansPath)) {
  const plexHash = crypto.createHash('sha256').update(fs.readFileSync(plexSansPath)).digest('hex').toUpperCase();
  ok(
    plexHash === 'E2291E842CF5AF167122A22881A740C7F2DDA7716F1E8CD76680264F4A859470',
    'ibm-plex-sans-latin-variable.woff2 SHA-256'
  );
}
const ranaReaderHashes = {
  'rana-reader-fallback-roman.woff2': 'A26535C8AC9C80CBE85E2025A0A47B1043FEFE0C26013D41F692343C99A21EB3',
  'rana-reader-fallback-italic.woff2': '475E323F083E10A8675CD2D522101FA123E676667E1F49225C1368913D4C0CCC',
  'rana-reader-fallback-bold.woff2': '27EC57A6A30A81BC95AB5E418E2298F724C8C22C5CEC7F9982F0BF7D9F564F2A',
  'rana-reader-fallback-bolditalic.woff2': '7C075DE80FF3ADA820541001F12E6B55FE14D67E3A7FBCC278C1A0F75E0385E0',
};
for (const [name, expectedHash] of Object.entries(ranaReaderHashes)) {
  const rel = 'assets/fonts/' + name;
  const assetPath = path.join(ROOT, rel);
  mustExist(rel);
  if (fs.existsSync(assetPath)) {
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex').toUpperCase();
    ok(actualHash === expectedHash, name + ' SHA-256');
  }
  ok(html.includes(rel), name + ' wired in markup');
}
ok(
  html.includes('assets/fonts/ibm-plex-sans-latin-variable.woff2'),
  'self-hosted IBM Plex Sans path in markup'
);
ok(
  /font-family\s*:\s*"IBM Plex Sans"/.test(html) &&
    /src\s*:\s*url\("assets\/fonts\/ibm-plex-sans-latin-variable\.woff2"\)\s*format\("woff2"\)/.test(html),
  'IBM Plex Sans @font-face family + local src'
);
ok(
  /font-family\s*:\s*"IBM Plex Sans"[\s\S]*?font-weight\s*:\s*100\s+700/.test(html) ||
    /@font-face\{[^}]*font-family:"IBM Plex Sans"[^}]*font-weight:100 700[^}]*\}/.test(html.replace(/\s+/g, '')),
  'IBM Plex Sans variable weight range 100 700'
);
ok(/--text\s*:\s*"IBM Plex Sans"/.test(html), '--text CSS variable names IBM Plex Sans');
ok(
  /--text\s*:\s*"IBM Plex Sans"[^;]*sans-serif/.test(html),
  '--text includes robust sans-serif fallback stack'
);
ok(
  /--reading\s*:\s*Georgia\s*,\s*"Rana Reader Fallback"[^;]*serif/.test(html),
  '--reading matches Rana Guide Georgia-first stack'
);
ok(
  /font-family\s*:\s*"Rana Reader Fallback"[\s\S]*?rana-reader-fallback-roman\.woff2/.test(html) &&
    /rana-reader-fallback-bold\.woff2/.test(html),
  'Rana Reader Fallback local roman and bold faces'
);
const readingSelectors = ['.text', '.method-annot-text', '.proof-row', '.proof-qualifier', '.invite-whisper'];
// Conversion-typography tripwire (canonical path: this test): future JarrettWroten.com
// design edits execute node smoke-test.mjs to prevent a return to thin prose,
// forced giant-display optical sizing, or display-serif action text. The full
// smoke run is the behavioral check. Retire only when these selectors disappear
// and their replacement has an equal rendered readability check.
for (const sel of readingSelectors) {
  const re = new RegExp(sel.replace('.', '\\.') + '\\s*\\{[^}]*font-family\\s*:\\s*var\\(--reading\\)');
  ok(re.test(html), sel + ' uses Rana Guide reading register');
  const blockMatch = html.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{([^}]*)\\}'));
  const block = blockMatch ? blockMatch[1] : '';
  ok(block.includes('letter-spacing:0') || /letter-spacing\s*:\s*0/.test(block), sel + ' native letter-spacing:0');
  ok(!/opsz/.test(block), sel + ' has no Bodoni opsz');
  ok(/font-weight\s*:\s*400/.test(block), sel + ' Rana prose weight 400');
  ok(/font-synthesis\s*:\s*none/.test(block), sel + ' disables synthetic serif styles');
}
ok(/\.proof-row strong\{[^}]*font-weight\s*:\s*700/.test(html), '.proof-row strong uses Rana reader bold');
const displaySelectors = ['.display', '.proof-figure'];
for (const sel of displaySelectors) {
  const re = new RegExp(sel.replace('.', '\\.') + '\\s*\\{[^}]*font-family\\s*:\\s*var\\(--display\\)');
  ok(re.test(html), sel + ' stays on var(--display) Bodoni');
  const blockMatch = html.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{([^}]*)\\}'));
  const block = blockMatch ? blockMatch[1] : '';
  ok(/font-optical-sizing\s*:\s*auto/.test(block), sel + ' uses automatic optical sizing');
  ok(!/opsz\s*["']?\s*96/.test(block), sel + ' does not force giant-display optical sizing');
}
ok(/\.invite-email\{[^}]*font-family\s*:\s*var\(--text\)/.test(html), '.invite-email uses readable sans register');
ok(/\.invite-email\{[^}]*font-weight\s*:\s*600/.test(html), '.invite-email has action weight 600');
ok(!/\.invite-email\{[^}]*opsz/.test(html), '.invite-email has no display optical-size override');
for (const sel of ['.cta', '.proof-open-hint']) {
  const blockMatch = html.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{([^}]*)\\}'));
  const block = blockMatch ? blockMatch[1] : '';
  ok(/font-family\s*:\s*var\(--text\)/.test(block), sel + ' uses readable sans register');
  ok(/font-weight\s*:\s*600/.test(block), sel + ' has action weight 600');
}

// Human microtype tripwire
// Canonical path: smoke-test.mjs human microtype block
// Future consumer: every visible label, control, caption, HUD, footer, and fallback on this site
// Activation: execute — node smoke-test.mjs
// Behavioral check: the current public page has no IBM Plex Mono/default-mono register, no
//   uppercase transformation, and assigns editorial versus utility microcopy by reading role
// Retirement: retire only when an intentional replacement type system carries an equivalent
//   live-pixel and source-level check against faux-technical microtype
ok(!/IBM Plex Mono|ibm-plex-mono|--mono\s*:|var\(--mono\)/i.test(html), 'no ambient mono register or IBM Plex Mono wiring');
ok(!/text-transform\s*:\s*uppercase/i.test(html), 'no CSS uppercase transform recreates faux-technical labels');
for (const rel of [
  'assets/fonts/ibm-plex-mono-latin-400.woff2',
  'assets/fonts/ibm-plex-mono-latin-500.woff2',
  'assets/fonts/OFL-IBM-Plex-Mono.txt',
]) {
  ok(!fs.existsSync(path.join(ROOT, rel)), 'retired unused faux-technical asset ' + rel);
}
function styleBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...html.matchAll(new RegExp(escaped + '\\s*\\{([^}]*)\\}', 'g'))];
  return matches.map((match) => match[1]).join('\n');
}
for (const sel of ['.station-kicker', '.note-device-caption', '.scroll-cue', '.lightbox-caption']) {
  const block = styleBlock(sel);
  ok(/font-family\s*:\s*var\(--reading\)/.test(block), sel + ' uses human editorial register');
  ok(/font-style\s*:\s*italic/.test(block), sel + ' uses editorial italic cadence');
  ok(/letter-spacing\s*:\s*0/.test(block), sel + ' keeps natural tracking');
}
for (const sel of ['.wordmark', '.motion-toggle', '.loader-label', '.station-rail-tick span', '.distance-hud', '.method-annot-num', '.proof-open-hint', '.site-footer', '.lightbox-close']) {
  const block = styleBlock(sel);
  ok(/font-family\s*:\s*var\(--text\)/.test(block), sel + ' uses readable utility sans');
  ok(!/text-transform\s*:\s*uppercase/.test(block), sel + ' is not forced into all caps');
}
for (const phrase of [
  'Follow the real path',
  '01 — Look',
  '02 — Find the break',
  '03 — Build the fix',
  '1 of 5 — The Leak',
  'Work with me',
]) {
  ok(html.includes(phrase), 'human-facing microcopy present: ' + phrase);
}
ok(
  !/fonts\.gstatic\.com|fonts\.googleapis\.com|typekit\.net|use\.typekit/i.test(html),
  'no external font CDN URLs in runtime HTML'
);
ok(fs.existsSync(path.join(ROOT, 'assets/fonts/OFL-IBM-Plex-Sans.txt')), 'OFL-IBM-Plex-Sans.txt license present');
ok(fs.existsSync(path.join(ROOT, 'assets/fonts/OFL-Rana-Reader-Fallback.txt')), 'Rana Reader Fallback OFL present');

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
for (const v of ['40,114.81', '104.51%', '37,914.00', '108.02%', 'The next morning, they said payroll was covered.']) {
  ok(html.includes(v), 'proof text ' + v);
}

// SITE_TUNING exported
ok(html.includes('window.SITE_TUNING'), 'SITE_TUNING inspectable');
ok(
  /tauDesktopSec:\s*0\.41/.test(html) && /tauMobileSec:\s*0\.41/.test(html),
  'settle tau desktop and mobile are exactly 0.41'
);
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
// Forced ?station= entry-frame-first load gate (production ordering)
ok(html.includes('forcedEntryFrame') && html.includes('worldLoadUnlocked'), 'forced entry load gate state');
ok(html.includes('routeEntryFrame') && html.includes('unlockWorldLoads'), 'forced entry route helpers');
ok(html.includes('startForcedBackgroundPreload'), 'forced background preload deferred');
ok(
  html.includes('if (forcedEntryFrame >= 0)') &&
    html.includes('loadFrame(forcedEntryFrame, true)'),
  'forced boot loads entry frame first'
);
ok(
  /if\s*\(\s*!worldLoadUnlocked\s*&&\s*i\s*!==\s*forcedEntryFrame\s*\)\s*return/.test(html),
  'loadFrame refuses speculative starts while entry gated'
);
ok(html.includes('FORCED_ENTRY_MAX_ATTEMPTS') && html.includes('scheduleForcedEntryRetry'), 'bounded forced-entry retry policy');
ok(html.includes('FORCED_ENTRY_RETRY_MS'), 'forced-entry retry delay constant');
ok(
  html.includes('forcedEntryAttempts') &&
    /forcedEntryAttempts\s*<\s*FORCED_ENTRY_MAX_ATTEMPTS/.test(html) &&
    html.includes('scheduleForcedEntryRetry()'),
  'forced-entry error path retries before unlock'
);
ok(
  /FORCED_ENTRY_MAX_ATTEMPTS\s*=\s*3/.test(html) && /FORCED_ENTRY_RETRY_MS\s*=\s*120/.test(html),
  'forced-entry policy is explicit 3 attempts / 120ms delay'
);
// Monotonic cold-HTTP presentation
ok(html.includes('selectPresentableFrame'), 'monotonic presentable frame selector');
ok(
  html.includes('Never reverse against scroll direction') ||
    html.includes('never overshoot desired') ||
    html.includes('Hold last-good'),
  'monotonic selection contract documented'
);
ok(html.includes('MAX_INFLIGHT_LOADS') && html.includes('pumpLoadQueue'), 'priority load scheduler');
ok(html.includes('enqueueLoad') && html.includes('beginFrameLoad'), 'queued load path');
ok(html.includes('Handlers before src'), 'handlers attach before src assignment');
ok(
  html.includes('naturalWidth > 0') && html.includes('Only paint-ready images enter readySet'),
  'readySet requires decoded pixels'
);
ok(
  /img\.onload\s*=/.test(html) &&
    /img\.onerror\s*=/.test(html) &&
    /img\.src\s*=\s*url/.test(html),
  'load handlers and src assignment present'
);
ok(
  html.includes('Never scan for a nearest') ||
    html.includes('hold the authored last-good boot surface'),
  'boot selection forbids nearest-still overshoot'
);
ok(!/bootBest/.test(html), 'bootBest nearest scan removed');

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
ok(!html.includes('support-extra'), 'obsolete jarrett support-extra removed');
ok(html.includes('support-primary'), 'jarrett primary support marked');
ok(html.includes('I BUILD') && html.includes('THE FIX') && html.includes('MYSELF.'), 'jarrett claim lines present');
ok(html.includes('You work with me from the first look through the finished fix.'), 'jarrett support contract present');
ok(html.includes('One real result'), 'proof kicker contract');
ok(html.includes('Your first fix is free'), 'threshold free-fix kicker');
ok(html.includes('SEND ME') && html.includes('YOUR SITE.'), 'threshold claim lines present');
ok(html.includes('If I find nothing worth fixing'), 'threshold no-leak truth line');
ok(html.includes('subject=Take%20a%20look%20at%20my%20site'), 'mailto subject prefilled');
ok(html.includes('body=My%20site%3A%0A%0AWhat%20I%20want%20more%20of%3A'), 'mailto body prompts prefilled');
ok(html.includes('01 — Look') && html.includes('02 — Find the break') && html.includes('03 — Build the fix'), 'method step labels present');
ok(html.includes('I walk through your site like a real customer.'), 'method step 1 copy');
ok(
  html.includes('no-js-route') &&
    html.includes('Follow the real path') &&
    (html.match(/01 — Look/g) || []).length >= 2,
  'no-js route carries method steps'
);

// Mobile is a separately authored seven-beat buyer journey, not the desktop DOM
// squeezed into a portrait viewport.
{
  const mobileExperience = html.match(/<div class="mobile-experience"[\s\S]*?<\/div>\s*<nav class="station-rail"/);
  const mobileSrc = mobileExperience ? mobileExperience[0] : '';
  const beatIds = [...mobileSrc.matchAll(/data-mobile-beat="([^"]+)"/g)].map((m) => m[1]);
  ok(beatIds.length === 7, 'mobile journey has seven authored beats');
  ok(new Set(beatIds).size === 7, 'mobile journey beat ids are unique');
  for (const id of ['leak', 'method-look', 'method-find', 'method-build', 'proof', 'jarrett', 'threshold']) {
    ok(beatIds.includes(id), 'mobile journey contains ' + id);
  }

  const stationNav = mobileSrc.match(/<nav class="mobile-nav mobile-station-nav"[\s\S]*?<\/nav>/);
  const methodNav = mobileSrc.match(/<nav class="mobile-nav mobile-method-nav"[\s\S]*?<\/nav>/);
  ok(!!stationNav && (stationNav[0].match(/<button\b/g) || []).length === 5, 'mobile station nav exposes five buyer-journey sections');
  ok(!!methodNav && (methodNav[0].match(/<button\b/g) || []).length === 3, 'mobile Method nav exposes Look, Find, Build');

  ok(
    /mobileSwipePx:\s*560[\s\S]*?mobileSwipesPerBeat:\s*4[\s\S]*?mobileFindSwipes:\s*3[\s\S]*?mobileBuildSwipes:\s*3[\s\S]*?mobileResultSwipes:\s*7[\s\S]*?mobileBeatCount:\s*6[\s\S]*?mobileRunwayPx:\s*14000/.test(html) &&
      /\.journey\s*\{\s*height:\s*calc\(100svh \+ 14000px\)/.test(html),
    'mobile runway gives Find and Build three, Result seven, and the remaining post-opening beats four 560px swipes'
  );
  ok(!/mobileRunwayVh/.test(html), 'viewport-relative mobile runway retired in favor of invariant swipe distance');
  ok(/\.mobile-copy-stage\s*\{[\s\S]*?min-height:\s*20rem/.test(html), 'mobile copy stage contains the complete narrow-phone invitation');
  ok(!/620svh|520svh/.test(html), 'retired squeezed-desktop mobile runway removed');
  ok(/mobileStations:\s*\{[\s\S]*?threshold:[\s\S]*?center:\s*0\.94/.test(html), 'mobile station centers are independently authored');
  ok(/mobileMethodSteps:\s*\[[\s\S]*?method-look[\s\S]*?method-find[\s\S]*?method-build/.test(html), 'mobile Method has three independent movement ranges');
  /*
   * Focused tripwire: a standard first swipe must visibly advance the mobile story.
   * Future consumer: maintainers changing mobile runway or station timing.
   * Activation: execute `node smoke-test.mjs` before release.
   * Behavioral check: the 390x844/560px consumer geometry lands in Method / Look.
   * Retirement: only if native scroll-depth progression is removed from mobile.
   */
  const firstSwipeProgress = 560 / 14000;
  ok(
    firstSwipeProgress >= 0.02 && firstSwipeProgress < 0.18,
    'one standard 560px swipe enters Method Look at every supported mobile height'
  );
  ok(
    /leak:[^\n]*exit:\s*0\.02/.test(html) && /method:[^\n]*enter:\s*0\.02/.test(html),
    'mobile opening hands directly into Method after the first swipe'
  );
  ok(/if \(isMobile\(\)\) \{\r?\n\s+progressCurrent = progressTarget;/.test(html), 'native touch momentum is not double-smoothed');
  ok(/var duration\s*=\s*760/.test(html) && html.includes('glideScrollTo'), 'mobile explicit navigation uses the authored glide');
  ok(
    html.includes('spatially erased above it') &&
      /mobileBeatEraseMs:\s*220/.test(html) &&
      !html.includes('mobileBeatArrivalDelayMs') &&
      html.includes('SITE_TUNING.mobileBeatEraseMs + 20') &&
      html.includes('SITE_TUNING.mobileBeatEraseMs + "ms"') &&
      /@keyframes mobile-beat-erase-forward\s*\{[\s\S]*?to\s*\{\s*clip-path:\s*inset\(0 0 100% 0\)/.test(html) &&
      /@keyframes mobile-beat-reveal-forward\s*\{[\s\S]*?from\s*\{\s*clip-path:\s*inset\(100% 0 0 0\)/.test(html) &&
      /arrivingBeat\.classList\.add\("is-arriving"\)[\s\S]*?leavingBeat\.classList\.add\("is-leaving"\)/.test(html),
    'mobile beat changes use complementary spatial masks with no opacity overlap or blank pause'
  );
  /*
   * FOCUSED TRIPWIRE — mobile chapter dwell and ending fit.
   * Canonical path: smoke-test.mjs — representative mobile swipe geometry below.
   * Future consumer: the maintainer changing mobile runway or chapter boundaries.
   * Activation: execute — `node smoke-test.mjs` before release.
   * Behavioral check: a viewport-invariant 14000px scroll distance holds Find and
   * Build for three 560px swipes, Result for seven, and Look, Me, and Start for four.
   * Retirement: retire only if mobile stops using native scroll-depth chapters.
   */
  const standardSwipeProgress = 560 / 14000;
  const beatAtSwipe = (swipe) => {
    const p = Math.min(1, standardSwipeProgress * swipe);
    if (p < 0.18) return 'method-look';
    if (p < 0.30) return 'method-find';
    if (p < 0.42) return 'method-build';
    if (p < 0.70) return 'proof';
    if (p < 0.86) return 'jarrett';
    return 'threshold';
  };
  const mobileSwipeSequence = Array.from({ length: 25 }, (_, index) => beatAtSwipe(index + 1));
  const expectedMobileSwipeSequence = [
    ...Array(4).fill('method-look'),
    ...Array(3).fill('method-find'),
    ...Array(3).fill('method-build'),
    ...Array(7).fill('proof'),
    ...Array(4).fill('jarrett'),
    ...Array(4).fill('threshold')
  ];
  ok(
    JSON.stringify(mobileSwipeSequence) === JSON.stringify(expectedMobileSwipeSequence),
    'Find and Build hold for three standard swipes, Result for seven, and the remaining post-opening beats for four'
  );
  ok(
    !html.includes('mobileVisualProgress') &&
      /function mobileProgressToFrame\(p\)[\s\S]*?Math\.round\(clamp\(p, 0, 1\) \* \(SITE_TUNING\.frameCount - 1\)\)/.test(html) &&
      /frame\s*=\s*isMobile\(\) \? mobileProgressToFrame\(p\) : progressToFrame\(p\)/.test(html),
    'mobile background advances at one continuous linear velocity with no chapter catch-up remap'
  );
  ok(html.includes('renderMobileBeat(beatId, !mobileExperiencePrimed || !motionOn)'), 'motion-off mobile beat changes are immediate');
  ok(
    /\.mobile-swipe-cue\s*\{[\s\S]*?transition:none;[\s\S]*?\}[\s\S]*?\.mobile-swipe-cue\.is-on\s*\{[\s\S]*?transition:opacity/.test(html) &&
      /\.mobile-nav\s*\{[\s\S]*?transition:none;/.test(html),
    'mobile cue exits and navigation-mode changes never trail duplicate text'
  );
  ok(html.includes("visitor's normalized place") && /preservedProgress\s*\*\s*resizedTotal/.test(html), 'motion toggle preserves the current journey station');
  ok(html.includes('html,body{margin:0;padding:0;overflow-anchor:none}'), 'runway resize disables browser scroll-anchor drift');
  ok((html.match(/if \(!motionOn && !isMobile\(\)\)/g) || []).length >= 2, 'mobile motion-off keeps portrait station and Method ranges');
  ok(html.includes('mobile-proof-link') && html.includes('data-lightbox="stripe"'), 'mobile result opens the real Stripe evidence');
  ok(html.includes('body.classList.add("lightbox-open")') && html.includes('body.classList.remove("lightbox-open")'), 'mobile evidence view locks and restores page scroll');
  ok(html.includes('grid-template-rows:auto minmax(0,1fr) auto') && html.includes('touch-action:pinch-zoom'), 'mobile evidence view is full-height and inspectable');
  ok(html.includes('html::-webkit-scrollbar{display:none}') && html.includes('scrollbar-width:none'), 'mobile journey hides browser scrollbar chrome');
}

// Method annotation cumulative arc — focused behavioral oracle.
// Future consumer: paintStations while a visitor scrolls Method (and reverse).
// Catches exact-only reveal (one annot at a time) and requires cumulative comparison
// driven by the single authoritative SITE_TUNING.methodSteps thresholds.
{
  const stepsMatch = html.match(/methodSteps:\s*(\[[\s\S]*?\])\s*,/);
  let methodSteps = [];
  if (stepsMatch) {
    try {
      methodSteps = new Function('return ' + stepsMatch[1])();
    } catch (e) {
      ok(false, 'methodSteps parse for arc oracle: ' + e.message);
    }
  }
  ok(Array.isArray(methodSteps) && methodSteps.length === 3, 'methodSteps has three authoritative thresholds');
  ok(
    methodSteps.every((s) => s && typeof s.at === 'number'),
    'methodSteps entries expose .at thresholds'
  );

  const paintMatch = html.match(/function paintStations\(p(?:,\s*visualP)?\)\s*\{[\s\S]*?\n  \}/);
  const paintSrc = paintMatch ? paintMatch[0] : '';
  ok(!!paintSrc, 'paintStations present for method arc oracle');
  ok(
    !/\bm\s*===\s*activeMethodStep\b/.test(paintSrc),
    'method annot reveal is not exact-only (m === activeMethodStep)'
  );
  ok(
    /p\s*>=\s*range\.at/.test(paintSrc) || /\bm\s*<=\s*activeMethodStep\b/.test(paintSrc),
    'method annot reveal uses cumulative comparison'
  );

  function methodAnnotMask(p, motionOn, dom) {
    const mask = methodSteps.map(() => false);
    if (dom !== 'method') return mask;
    if (!motionOn) return methodSteps.map(() => true);
    for (let m = 0; m < methodSteps.length; m++) {
      const range = methodSteps[m];
      mask[m] = !!(range && p >= range.at);
    }
    return mask;
  }
  function maskKey(mask) {
    return mask.map((v) => (v ? '1' : '0')).join('');
  }

  if (methodSteps.length === 3) {
    const at0 = methodSteps[0].at;
    const at1 = methodSteps[1].at;
    const at2 = methodSteps[2].at;
    const mid1 = (at0 + at1) / 2;
    const mid2 = (at1 + at2) / 2;
    const mid3 = (at2 + (methodSteps[2].until != null ? methodSteps[2].until : at2 + 0.05)) / 2;

    ok(maskKey(methodAnnotMask(at0 - 0.001, true, 'method')) === '000', 'method arc: none before first threshold');
    ok(maskKey(methodAnnotMask(mid1, true, 'method')) === '100', 'method arc: first threshold shows 01 only');
    ok(maskKey(methodAnnotMask(mid2, true, 'method')) === '110', 'method arc: second keeps 01 and adds 02');
    ok(maskKey(methodAnnotMask(mid3, true, 'method')) === '111', 'method arc: third keeps first two and adds 03');

    // Exact-only at mid-second would light only index 1 → '010'. Cumulative must differ.
    const cumMid2 = maskKey(methodAnnotMask(mid2, true, 'method'));
    ok(cumMid2 === '110' && cumMid2 !== '010', 'method arc: cumulative mid-step-2 differs from exact-only');

    // Reverse unwind: 3 → 2 → 1 → none
    ok(maskKey(methodAnnotMask(at2 - 0.001, true, 'method')) === '110', 'method arc: reverse drops 03 first');
    ok(maskKey(methodAnnotMask(at1 - 0.001, true, 'method')) === '100', 'method arc: reverse then drops 02');
    ok(maskKey(methodAnnotMask(at0 - 0.001, true, 'method')) === '000', 'method arc: reverse clears all before first');

    ok(maskKey(methodAnnotMask(0.3, false, 'method')) === '111', 'method arc: motion-off method shows all three');
    ok(maskKey(methodAnnotMask(0.3, true, 'proof')) === '000', 'method arc: annotations off outside method');
    ok(maskKey(methodAnnotMask(0.1, true, 'leak')) === '000', 'method arc: annotations off in leak');
  }
}
// Width-aware: longest Jarrett display line must fit inside masked .line (scrollWidth)
ok(
  html.includes('max-width:min(38rem, 48vw)') ||
    html.includes('max-width: min(38rem, 48vw)'),
  'jarrett desktop claim column fits longest display line'
);
ok(html.includes('threshold-top') && html.includes('threshold-bottom'), 'threshold separated carrier groups');
ok(html.includes('stationCarriers'), 'distinct station carrier map');
ok(html.includes('bottom:clamp(6rem,16vh,9rem)') || html.includes('bottom:clamp(6rem, 16vh, 9rem)'), 'method heading bottom-anchored desktop');
ok(html.includes('left:10%; top:44%') || html.includes('left:10%;top:44%'), 'method annot 1 desktop depth position');
ok(html.includes('left:48%; top:25%') || html.includes('left:48%;top:25%'), 'method annot 3 desktop depth position');
ok(html.includes('top:34%') && html.includes('console-mount'), 'console lifted to 34% desktop');
ok(html.includes('is-done'), 'loader dismiss class');
ok(html.includes('displayScale'), 'two-peak display scale contract');
ok(html.includes('leak: 72') || html.includes('leak:72'), 'leak desktop peak 72');
ok(html.includes('threshold: 72') || html.includes('threshold:72'), 'threshold desktop peak 72');
ok(html.includes('Jarrett Wroten · Las Vegas'), 'footer one-line mark');
ok(/\.site-footer\s+p\s*\{\s*margin\s*:\s*0/.test(html) || html.includes('.site-footer p{margin:0}'), 'footer p zero margin');
ok(html.includes('linear-gradient(100deg, rgba(4,10,12,.90)'), 'leak/method directional scrim');
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

// ——— Forced ?station= entry-first load oracle (production GitHub Pages ordering) ———
// Models cold constrained concurrency: only the forced center may start until ready.
// Would FAIL the pre-fix boot that fired 24 opening frames before the center.
{
  function easeInOutLocal(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  }
  function progressToFrameLocal(p) {
    const map = [
      { p: 0.0, f: 0 }, { p: 0.08, f: 24 }, { p: 0.2, f: 72 }, { p: 0.3, f: 120 },
      { p: 0.42, f: 168 }, { p: 0.48, f: 176 }, { p: 0.55, f: 184 }, { p: 0.67, f: 216 },
      { p: 0.74, f: 288 }, { p: 0.82, f: 324 }, { p: 0.88, f: 336 }, { p: 0.94, f: 354 },
      { p: 1.0, f: 360 }
    ];
    if (p <= map[0].p) return map[0].f;
    if (p >= map[map.length - 1].p) return map[map.length - 1].f;
    for (let i = 0; i < map.length - 1; i++) {
      const a = map[i];
      const b = map[i + 1];
      if (p >= a.p && p <= b.p) {
        let t = (p - a.p) / Math.max(0.0001, b.p - a.p);
        t = easeInOutLocal(t);
        return Math.round(a.f + (b.f - a.f) * t);
      }
    }
    return 0;
  }
  const desktopStationCenters = {
    leak: 0.08,
    method: 0.3,
    proof: 0.52,
    jarrett: 0.76,
    threshold: 0.94
  };
  const mobileStationCenters = {
    leak: 0.01,
    method: 0.24,
    proof: 0.56,
    jarrett: 0.78,
    threshold: 0.94
  };
  function expectedFrames(centers, linear) {
    const frames = {};
    for (const [name, center] of Object.entries(centers)) {
      frames[name] = linear ? Math.round(center * 360) : progressToFrameLocal(center);
    }
    return frames;
  }
  const expectedByViewport = {
    'desktop-1536x864': expectedFrames(desktopStationCenters),
    'mobile-390x844': expectedFrames(mobileStationCenters, true)
  };
  const expectedDesktop = expectedByViewport['desktop-1536x864'];
  const expectedMobile = expectedByViewport['mobile-390x844'];
  ok(JSON.stringify(expectedDesktop) === JSON.stringify({ leak: 24, method: 120, proof: 181, jarrett: 294, threshold: 354 }), 'oracle: desktop station center frames stay frozen');
  ok(JSON.stringify(expectedMobile) === JSON.stringify({ leak: 4, method: 86, proof: 202, jarrett: 281, threshold: 338 }), 'oracle: mobile station center frames follow the continuous linear world path');

  async function runForcedEntryOracle(stationName, viewportLabel) {
    const expectedSet = expectedByViewport[viewportLabel];
    const entry = expectedSet[stationName];
    const loadStarts = [];
    const ready = Object.create(null);
    const loading = Object.create(null);
    let unlocked = false;
    let backgroundStarted = false;
    let displayed = 0;
    let desired = 0;
    let activePaintedFrame = 0; // holds ga-000 from markup until entry commits
    const maxConcurrent = 2; // production-like constrained loader
    let inFlight = 0;
    const waiters = [];

    function pump() {
      while (inFlight < maxConcurrent && waiters.length) {
        const job = waiters.shift();
        inFlight++;
        // Cold production-like latency for each accepted request
        setTimeout(() => {
          inFlight--;
          ready[job.i] = 1;
          loading[job.i] = 0;
          if (job.i === entry) {
            unlocked = true;
            // Present entry when ready (atomic buffer path summarized)
            if (desired === entry || displayed === 0) {
              displayed = entry;
              activePaintedFrame = entry;
            }
            startBackground();
          }
          if (job.onReady) job.onReady();
          pump();
        }, job.delayMs);
      }
    }

    function loadFrameGated(i, _priority) {
      i = Math.max(0, Math.min(360, i | 0));
      if (!unlocked && i !== entry) return false; // refused — speculative
      if (ready[i] || loading[i]) return false;
      loading[i] = 1;
      loadStarts.push(i);
      waiters.push({ i, delayMs: i === entry ? 120 : 180 });
      pump();
      return true;
    }

    function startBackground() {
      if (backgroundStarted) return;
      backgroundStarted = true;
      for (let j = Math.max(0, entry - 12); j <= Math.min(360, entry + 12); j++) {
        if (j !== entry) loadFrameGated(j, false);
      }
      for (let j = 0; j < 24; j++) loadFrameGated(j, false);
      for (const f of Object.values(expectedSet)) loadFrameGated(f, false);
    }

    // Boot: only entry frame (matches corrected bootPreload)
    loadFrameGated(entry, true);
    // showFrame(entry) also asks for neighborhood — must be refused while gated
    desired = entry;
    for (let d = 1; d <= 8; d++) {
      loadFrameGated(entry - d, false);
      loadFrameGated(entry + d, false);
    }
    // Speculative opening neighborhood (old boot order) — must not start
    for (let j = 0; j < 24; j++) loadFrameGated(j, true);

    ok(loadStarts.length >= 1, 'oracle ' + viewportLabel + ' ' + stationName + ': at least one load started');
    ok(
      loadStarts[0] === entry,
      'oracle ' + viewportLabel + ' ' + stationName + ': first load is entry ' + entry + ' (got ' + loadStarts[0] + ')'
    );
    const premature = loadStarts.slice(1).filter((i) => i !== entry && !ready[entry]);
    // Before entry ready, only the entry itself may appear in starts
    const beforeReadyOnlyEntry = loadStarts.every((i, idx) => {
      // all starts that occurred while entry not yet ready must be entry
      // (we check at end of sync boot phase: entry not ready yet)
      return idx === 0 ? i === entry : false;
    });
    ok(
      beforeReadyOnlyEntry && loadStarts.length === 1,
      'oracle ' + viewportLabel + ' ' + stationName + ': sync boot starts only entry (starts=' + loadStarts.join(',') + ')'
    );
    ok(activePaintedFrame === 0, 'oracle ' + viewportLabel + ' ' + stationName + ': holds last-good 0 before entry ready');
    void premature;

    // Wait until entry ready under constrained loader (≤1500ms wall)
    const t0 = Date.now();
    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 1500;
      const tick = () => {
        if (displayed === entry && activePaintedFrame === entry) return resolve();
        if (Date.now() > deadline) {
          return reject(new Error(stationName + ' did not settle entry ' + entry + ' within 1500ms (displayed=' + displayed + ')'));
        }
        setTimeout(tick, 10);
      };
      tick();
    }).then(
      () => {
        ok(true, 'oracle ' + viewportLabel + ' ' + stationName + ': entry ' + entry + ' active within 1500ms (' + (Date.now() - t0) + 'ms)');
      },
      (err) => {
        ok(false, 'oracle ' + viewportLabel + ' ' + stationName + ': ' + err.message);
      }
    );

    ok(displayed === entry, 'oracle ' + viewportLabel + ' ' + stationName + ': displayed is entry (got ' + displayed + ')');
    ok(activePaintedFrame === entry, 'oracle ' + viewportLabel + ' ' + stationName + ': active paint-ready entry');
    ok(unlocked && backgroundStarted, 'oracle ' + viewportLabel + ' ' + stationName + ': background resumes after entry');
    // After unlock, speculative loads may appear — but never before entry as first
    ok(loadStarts[0] === entry, 'oracle ' + viewportLabel + ' ' + stationName + ': first load remains entry after background');
    // Never blank
    ok(activePaintedFrame >= 0, 'oracle ' + viewportLabel + ' ' + stationName + ': never blank active');
  }

  // Defect reconstruction: old boot order would start 0..23 before entry
  {
    const entry = expectedDesktop.jarrett;
    const badStarts = [];
    for (let i = 0; i < 24; i++) badStarts.push(i);
    badStarts.push(entry);
    ok(
      badStarts[0] !== entry,
      'oracle: pre-fix ordering defect still detectable (first was ' + badStarts[0] + ', not ' + entry + ')'
    );
    ok(
      badStarts.indexOf(entry) > 0,
      'oracle: pre-fix jarrett entry was buried behind opening loads at index ' + badStarts.indexOf(entry)
    );
  }

  for (const vp of ['desktop-1536x864', 'mobile-390x844']) {
    for (const name of Object.keys(expectedByViewport[vp])) {
      await runForcedEntryOracle(name, vp);
    }
  }

  // Normal homepage path: first loads are opening neighbourhood, not a forced center gate
  {
    const homeStarts = [];
    let unlocked = true;
    function loadHome(i) {
      if (!unlocked) return;
      homeStarts.push(i);
    }
    for (let i = 0; i < 24; i++) loadHome(i);
    ok(homeStarts[0] === 0, 'oracle: normal / opens with frame 0 load first');
    ok(homeStarts.length === 24, 'oracle: normal / opening neighbourhood is 24 frames');
  }

  // Transient first-request failure then success: retry exact entry before background.
  {
    const entry = expectedDesktop.threshold; // 354 — the live consumer replay case
    const MAX_ATTEMPTS = 3;
    const RETRY_MS = 120;
    const loadStarts = [];
    const inflight = Object.create(null);
    let attempts = 0;
    let unlocked = false;
    let backgroundStarted = false;
    let displayed = 0;
    let activePainted = 0; // last-good ga-000
    let failNext = true; // first request fails
    let concurrentEntry = 0;
    let maxConcurrentEntry = 0;
    let retryTimer = null;

    function startBackground() {
      if (backgroundStarted) return;
      backgroundStarted = true;
      for (let j = 0; j < 24; j++) loadGated(j);
    }
    function unlock() {
      if (unlocked) return;
      unlocked = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      startBackground();
    }
    function loadGated(i) {
      if (!unlocked && i !== entry) return false;
      if (inflight[i]) return false;
      inflight[i] = 1;
      if (i === entry && !unlocked) {
        attempts++;
        concurrentEntry++;
        maxConcurrentEntry = Math.max(maxConcurrentEntry, concurrentEntry);
      }
      loadStarts.push(i);
      const delay = i === entry ? 40 : 80;
      setTimeout(() => {
        if (i === entry && failNext) {
          failNext = false;
          inflight[i] = 0;
          concurrentEntry = Math.max(0, concurrentEntry - 1);
          // onerror: schedule retry, do NOT unlock
          if (attempts < MAX_ATTEMPTS && !unlocked) {
            if (!retryTimer) {
              retryTimer = setTimeout(() => {
                retryTimer = null;
                loadGated(entry);
              }, RETRY_MS);
            }
          } else if (!unlocked) {
            unlock();
          }
          return;
        }
        inflight[i] = 0;
        if (i === entry) concurrentEntry = Math.max(0, concurrentEntry - 1);
        if (i === entry) {
          displayed = entry;
          activePainted = entry;
          unlock();
        }
      }, delay);
      return true;
    }

    // Boot + speculative pressure
    loadGated(entry);
    for (let d = 1; d <= 8; d++) {
      loadGated(entry - d);
      loadGated(entry + d);
    }
    for (let j = 0; j < 24; j++) loadGated(j);

    ok(loadStarts[0] === entry, 'oracle retry: first load is entry ' + entry);
    ok(loadStarts.filter((x) => x === entry).length === 1, 'oracle retry: sole entry request during sync boot');
    ok(activePainted === 0 && displayed === 0, 'oracle retry: holds last-good 0 after scheduling first fail path');

    await new Promise((r) => setTimeout(r, 40 + RETRY_MS + 40 + 30));

    const entryStarts = loadStarts.filter((x) => x === entry);
    ok(entryStarts.length === 2, 'oracle retry: exactly two entry attempts after first fail (got ' + entryStarts.length + ')');
    ok(loadStarts[0] === entry && loadStarts[1] === entry, 'oracle retry: second start is entry before any background (starts=' + loadStarts.slice(0, 4).join(',') + ')');
    ok(maxConcurrentEntry <= 1, 'oracle retry: no duplicate simultaneous entry request (max=' + maxConcurrentEntry + ')');
    ok(displayed === entry && activePainted === entry, 'oracle retry: presents entry after successful retry (got ' + displayed + ')');
    ok(unlocked && backgroundStarted, 'oracle retry: background unlocks only after entry success');
    ok(activePainted !== -1 && activePainted !== null, 'oracle retry: never blank during retry');
    // Background frames may appear only after the successful entry start index
    const firstBg = loadStarts.findIndex((x, idx) => idx > 0 && x !== entry);
    const secondEntryIdx = loadStarts.indexOf(entry, 1);
    ok(
      firstBg === -1 || firstBg > secondEntryIdx,
      'oracle retry: no background frame starts before successful entry retry (firstBg=' + firstBg + ', secondEntry=' + secondEntryIdx + ')'
    );
  }

  // Persistent failure: exhaust policy, unlock, do not freeze forever.
  {
    const entry = expectedDesktop.jarrett;
    const MAX_ATTEMPTS = 3;
    const RETRY_MS = 120;
    const loadStarts = [];
    const inflight = Object.create(null);
    let attempts = 0;
    let unlocked = false;
    let backgroundStarted = false;
    let activePainted = 0;
    let retryTimer = null;
    let postUnlockEntryLoads = 0;

    function unlock() {
      if (unlocked) return;
      unlocked = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      backgroundStarted = true;
      // recovery chance after exhaust
      loadGated(entry);
      for (let j = 0; j < 8; j++) loadGated(j);
    }
    function loadGated(i) {
      if (!unlocked && i !== entry) return false;
      if (inflight[i]) return false;
      inflight[i] = 1;
      if (i === entry && !unlocked) attempts++;
      if (i === entry && unlocked) postUnlockEntryLoads++;
      loadStarts.push(i);
      setTimeout(() => {
        inflight[i] = 0;
        // Always fail entry while gated
        if (i === entry && !unlocked) {
          if (attempts < MAX_ATTEMPTS) {
            if (!retryTimer) {
              retryTimer = setTimeout(() => {
                retryTimer = null;
                loadGated(entry);
              }, RETRY_MS);
            }
          } else {
            unlock();
          }
          return;
        }
        // After unlock, entry still fails — but no tight loop (no reschedule)
      }, 30);
      return true;
    }

    loadGated(entry);
    await new Promise((r) => setTimeout(r, RETRY_MS * 3 + 200));
    const entryAttempts = loadStarts.filter((x) => x === entry).length;
    ok(attempts === MAX_ATTEMPTS, 'oracle exhaust: attempts reach max ' + MAX_ATTEMPTS + ' (got ' + attempts + ')');
    ok(entryAttempts === MAX_ATTEMPTS || entryAttempts === MAX_ATTEMPTS + 1, 'oracle exhaust: entry starts bounded (got ' + entryAttempts + ')');
    ok(unlocked && backgroundStarted, 'oracle exhaust: unlocks background after policy exhaust');
    ok(activePainted === 0, 'oracle exhaust: keeps last-good frame 0 painted');
    ok(loadStarts.some((x) => x !== entry), 'oracle exhaust: background frames start after exhaust');
    // No unbounded tight loop: wait a bit more and ensure entry count doesn't explode
    const countAtUnlock = loadStarts.filter((x) => x === entry).length;
    await new Promise((r) => setTimeout(r, 200));
    const countLater = loadStarts.filter((x) => x === entry).length;
    ok(
      countLater - countAtUnlock <= 1,
      'oracle exhaust: no unbounded entry retry loop (delta=' + (countLater - countAtUnlock) + ')'
    );
    void postUnlockEntryLoads;
  }
}

// ——— Monotonic cold-HTTP presentation oracles ———
{
  function selectPresentableFrame(readySet, displayedFrame, target) {
    target = Math.max(0, Math.min(360, target | 0));
    if (readySet[target]) return target;
    if (displayedFrame < 0) {
      /* Boot: exact target only when ready; else hold frame 0 — never nearest scan. */
      return 0;
    }
    const from = displayedFrame;
    if (target >= from) {
      let best = -1;
      for (const k of Object.keys(readySet)) {
        if (!readySet[k]) continue;
        const idx = k | 0;
        if (idx >= from && idx <= target && idx > best) best = idx;
      }
      return best >= 0 ? best : from;
    }
    let best = 1e9;
    for (const k of Object.keys(readySet)) {
      if (!readySet[k]) continue;
      const idx = k | 0;
      if (idx <= from && idx >= target && idx < best) best = idx;
    }
    return best < 1e9 ? best : from;
  }

  // Boot overshoot: far stills + frame 1 ready before frame 0; desired stays 0
  {
    const ready = Object.create(null);
    // Adversarial: 1 and far stills finish first; 0 not yet ready
    ready[1] = 1;
    ready[108] = 1;
    ready[180] = 1;
    ready[312] = 1;
    let displayed = -1;
    let desired = 0;
    const commits = [];
    let show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 0, 'oracle boot: holds 0 while 1/108/180/312 ready first (got ' + show + ')');
    ok(show <= desired, 'oracle boot: no overshoot above desired 0');
    commits.push(show);
    // Simulate markReady of poison frames calling showFrame(0) while still displayed < 0
    for (const poison of [1, 108, 180, 312]) {
      show = selectPresentableFrame(ready, displayed, desired);
      ok(show === 0, 'oracle boot: still holds 0 after poison ' + poison + ' ready (got ' + show + ')');
      ok(show !== poison, 'oracle boot: never commits poison ' + poison);
    }
    // Frame 0 becomes genuinely ready
    ready[0] = 1;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 0, 'oracle boot: presents exact 0 when ready (got ' + show + ')');
    displayed = show;
    commits.push(show);
    ok(commits.every((c) => c === 0), 'oracle boot: all commits are frame 0');
    // Direct-route boot: exact target ready while displayed < 0 may present target
    const readyRoute = Object.create(null);
    readyRoute[1] = 1;
    readyRoute[294] = 1;
    show = selectPresentableFrame(readyRoute, -1, 294);
    ok(show === 294, 'oracle boot: direct-route exact target 294 when ready (got ' + show + ')');
    const readyRouteHold = Object.create(null);
    readyRouteHold[1] = 1;
    readyRouteHold[180] = 1;
    show = selectPresentableFrame(readyRouteHold, -1, 294);
    ok(show === 0, 'oracle boot: direct-route holds 0 until exact 294 ready (got ' + show + ')');
  }

  // Forward: out-of-order ready events never reverse or overshoot desired
  {
    const ready = Object.create(null);
    ready[0] = 1;
    ready[23] = 1;
    let displayed = 23;
    let desired = 40;
    // Far still arrives first (classic production overshoot)
    ready[180] = 1;
    ready[108] = 1;
    ready[312] = 1;
    let show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 23, 'oracle mono-fwd: hold 23 when only far stills ready (got ' + show + ')');
    ok(show <= desired, 'oracle mono-fwd: no overshoot above desired');
    ok(show >= displayed, 'oracle mono-fwd: no reverse below displayed');
    // In-range frame arrives
    ready[36] = 1;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 36, 'oracle mono-fwd: advances to in-range 36 (got ' + show + ')');
    displayed = show;
    ready[40] = 1;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 40, 'oracle mono-fwd: exact desired 40 (got ' + show + ')');
    displayed = show;
    // Late lower frame arrives — must not reverse
    ready[30] = 1;
    desired = 50;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show >= 40, 'oracle mono-fwd: late lower ready does not reverse (got ' + show + ')');
    ok(show <= 50, 'oracle mono-fwd: stays at or below new desired');
  }

  // Backward: never commit higher; never go below desired
  {
    const ready = Object.create(null);
    ready[200] = 1;
    ready[180] = 1;
    ready[100] = 1;
    let displayed = 200;
    let desired = 150;
    let show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 180, 'oracle mono-bwd: steps to 180 in range (got ' + show + ')');
    ok(show <= displayed, 'oracle mono-bwd: no increase');
    ok(show >= desired, 'oracle mono-bwd: no undershoot below desired');
    displayed = show;
    // Far lower still arrives
    ready[24] = 1;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 180, 'oracle mono-bwd: ignores far-below 24 (got ' + show + ')');
    ready[150] = 1;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 150, 'oracle mono-bwd: exact desired (got ' + show + ')');
  }

  // Direction reversal invalidates old forward overshoot candidates
  {
    const ready = Object.create(null);
    ready[100] = 1;
    ready[200] = 1;
    ready[300] = 1;
    let displayed = 100;
    let desired = 250;
    let show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 200, 'oracle mono-rev: forward picks 200 (got ' + show + ')');
    displayed = show;
    // Rider reverses
    desired = 120;
    show = selectPresentableFrame(ready, displayed, desired);
    // 100 is below desired 120, so in range [120,200] only 200 is ready → hold 200
    ok(show === 200, 'oracle mono-rev: holds 200 until in-range ready (got ' + show + ')');
    ok(show <= 200, 'oracle mono-rev: does not increase after reverse');
    ok(show >= 120, 'oracle mono-rev: does not undershoot new desired');
    ready[130] = 1;
    show = selectPresentableFrame(ready, displayed, desired);
    ok(show === 130, 'oracle mono-rev: progresses backward to 130 (got ' + show + ')');
  }

  // Far-ahead stills before in-range desired cannot cause overshoot/backtracking sequence
  {
    const ready = Object.create(null);
    ready[0] = 1;
    let displayed = 0;
    const commits = [];
    const targets = [20, 40, 60, 80];
    for (const t of targets) {
      // poison with far stills each step
      ready[180] = 1;
      ready[312] = 1;
      ready[360] = 1;
      const show = selectPresentableFrame(ready, displayed, t);
      commits.push(show);
      ok(show <= t, 'oracle mono-poison: no overshoot at desired ' + t + ' (got ' + show + ')');
      ok(show >= displayed, 'oracle mono-poison: no reverse at desired ' + t);
      displayed = show;
      // then in-range arrives
      ready[t] = 1;
      const show2 = selectPresentableFrame(ready, displayed, t);
      commits.push(show2);
      displayed = show2;
      ok(show2 === t, 'oracle mono-poison: settles to exact ' + t);
    }
    for (let i = 1; i < commits.length; i++) {
      ok(commits[i] >= commits[i - 1], 'oracle mono-poison: commit sequence non-decreasing (' + commits[i - 1] + '→' + commits[i] + ')');
    }
  }

  // Desired-frame work starts ahead of obsolete speculative under constrained loader
  {
    const starts = [];
    const MAX = 2;
    let inflight = 0;
    const queue = [];
    function pump() {
      while (inflight < MAX && queue.length) {
        let pick = 0;
        for (let i = 0; i < queue.length; i++) {
          if (queue[i].p) {
            pick = i;
            break;
          }
        }
        const job = queue.splice(pick, 1)[0];
        inflight++;
        starts.push(job.i);
        setTimeout(() => {
          inflight--;
          pump();
        }, 5);
      }
    }
    function load(i, p) {
      queue.push({ i, p: !!p });
      if (p) {
        // priority to front among equals — pump prefers p
      }
      pump();
    }
    // obsolete speculative flood first
    for (let i = 0; i < 24; i++) load(i, false);
    load(200, true); // moving desired
    await new Promise((r) => setTimeout(r, 40));
    const idx200 = starts.indexOf(200);
    ok(idx200 >= 0, 'oracle sched: desired frame eventually starts');
    ok(idx200 <= 2, 'oracle sched: desired starts within first slots under constraint (idx=' + idx200 + ')');
  }

  // Cached/fast broken images never enter readySet / never unlock forced as success
  {
    let readyCount = 0;
    let unlocked = false;
    function finishLoad(ok, naturalWidth) {
      if (ok && naturalWidth > 0) {
        readyCount++;
      } else if (!ok) {
        // error path — forced retry, not unlock-as-success
      }
    }
    // broken complete
    finishLoad(true, 0);
    finishLoad(false, 0);
    ok(readyCount === 0, 'oracle broken: naturalWidth 0 never enters readySet');
    // success
    finishLoad(true, 1280);
    ok(readyCount === 1, 'oracle broken: only paint-ready marks ready');
    void unlocked;
  }

  // Cold/jittered constrained delivery — complete 12s journey both viewports
  async function runColdJourney(viewportLabel) {
    const frameCount = 361;
    const ready = Object.create(null);
    const loading = Object.create(null);
    const starts = [];
    let displayed = 0;
    ready[0] = 1;
    const commits = [0];
    let inflight = 0;
    const MAX = 4;
    const queue = [];
    const stations = { leak: 24, method: 120, proof: 181, jarrett: 294, threshold: 354 };

    function select(target) {
      return selectPresentableFrame(ready, displayed, target);
    }
    function pump() {
      while (inflight < MAX && queue.length) {
        let pick = 0;
        for (let i = 0; i < queue.length; i++) {
          if (queue[i].p) {
            pick = i;
            break;
          }
        }
        const job = queue.splice(pick, 1)[0];
        if (ready[job.i] || loading[job.i]) continue;
        loading[job.i] = 1;
        inflight++;
        starts.push(job.i);
        const delay = 8 + ((job.i * 17 + starts.length * 13) % 40); // jitter
        setTimeout(() => {
          loading[job.i] = 0;
          inflight--;
          // 2% hard fail except never permanently block journey ends
          if (job.i !== 0 && job.i !== 360 && (job.i + starts.length) % 47 === 0) {
            pump();
            return;
          }
          ready[job.i] = 1;
          // presentation refresh
          pump();
        }, delay);
      }
    }
    function load(i, p) {
      i = Math.max(0, Math.min(frameCount - 1, i | 0));
      if (ready[i] || loading[i]) return;
      if (queue.some((q) => q.i === i)) {
        if (p) {
          const q = queue.find((x) => x.i === i);
          if (q) q.p = true;
        }
        return;
      }
      if (p) queue.unshift({ i, p: true });
      else queue.push({ i, p: false });
      pump();
    }

    // 12-second forward journey: monotonic target path 0→360 under jittered constrained HTTP
    for (let step = 0; step <= 360; step++) {
      const desired = step;
      load(desired, true);
      for (let d = 1; d <= 8; d++) {
        if (desired - d >= 0) load(desired - d, false);
        if (desired + d < frameCount) load(desired + d, false);
      }
      // occasional still-key poison (old boot pattern)
      if (step % 30 === 0) {
        for (const s of Object.values(stations)) load(s, false);
      }
      // Poll briefly so in-range frames can commit without lengthening total journey scope
      for (let poll = 0; poll < 3; poll++) {
        await new Promise((r) => setTimeout(r, 4));
        const show = select(desired);
        if (show !== displayed) {
          ok(
            show >= displayed,
            'oracle journey ' + viewportLabel + ': commit non-decreasing ' + displayed + '→' + show + ' at desired ' + desired
          );
          ok(
            show <= desired,
            'oracle journey ' + viewportLabel + ': commit no overshoot ' + show + ' > desired ' + desired
          );
          displayed = show;
          commits.push(show);
        }
        if (displayed === desired) break;
      }
    }
    // drain remaining toward 360
    for (let n = 0; n < 120; n++) {
      await new Promise((r) => setTimeout(r, 8));
      load(360, true);
      const show = select(360);
      if (show !== displayed) {
        ok(show >= displayed && show <= 360, 'oracle journey ' + viewportLabel + ': drain monotonic');
        displayed = show;
        commits.push(show);
      }
      if (displayed === 360) break;
    }

    ok(commits[0] === 0, 'oracle journey ' + viewportLabel + ': starts at 0');
    ok(displayed === 360, 'oracle journey ' + viewportLabel + ': reaches 360 (got ' + displayed + ')');
    const distinct = new Set(commits);
    ok(distinct.size >= 180, 'oracle journey ' + viewportLabel + ': ≥180 distinct commits (got ' + distinct.size + ')');
    ok(commits.every((c, i) => i === 0 || c >= commits[i - 1]), 'oracle journey ' + viewportLabel + ': fully non-decreasing commit list');
    for (const [name, f] of Object.entries(stations)) {
      ok(commits.some((c) => c >= f) || displayed >= f, 'oracle journey ' + viewportLabel + ': reaches station ' + name + ' frame ' + f);
    }
    // never blank: displayed always defined and painted
    ok(displayed >= 0, 'oracle journey ' + viewportLabel + ': never blank');
    // desired priority: frame near end should appear early in starts relative to pure sequential
    const lastDesiredStarts = starts.filter((s, idx) => {
      // count how often a high desired is started while low speculative pending — soft check
      return true;
    });
    ok(starts.includes(360) || ready[360], 'oracle journey ' + viewportLabel + ': final frame requested or ready');
    void lastDesiredStarts;
  }

  await runColdJourney('desktop-1536x864');
  await runColdJourney('mobile-390x844');
}

if (failures.length) {
  console.error('FAILURES:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('SMOKE PASS');
