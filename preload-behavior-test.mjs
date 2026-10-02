import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = process.argv[2] || path.join(folder, 'index.html');
const html = fs.readFileSync(sourcePath, 'utf8');
const names = [
  'allowIdleFramePreload', 'preloadStillFrames', 'stopIdleFramePreload',
  'preloadBatch', 'scheduleIdlePreload', 'bootPreload',
  'startForcedBackgroundPreload', 'showFrame', 'applyMotionPreference',
  'markReady', 'unlockWorldLoads', 'processIsRendered'
];
const source = names.map((name) => {
  const start = html.indexOf(`  function ${name}(`);
  assert.notEqual(start, -1, `actual ${name} function exists`);
  const next = html.indexOf('\n  function ', start + 1);
  assert.notEqual(next, -1, `actual ${name} function has a following boundary`);
  return html.slice(start, next);
}).join('\n');
const tuningMatch = html.match(/  var PROCESS_TUNING = (\{[\s\S]*?\n  \});/);
assert.ok(tuningMatch, 'actual process tuning is available');

function setup({ motionOn = true, saveData = false, forced = -1, idleApi = true, readable = false, readQuery = false, shortScreen = false, rendered = true } = {}) {
  const requests = [];
  const callbacks = new Map();
  const cancelled = [];
  let nextHandle = 0;
  const context = {
    navigator: { connection: { saveData } },
    motionOn, worldLoadUnlocked: forced < 0, forcedEntryFrame: forced,
    forcedBackgroundStarted: false, forcedEntryRetryTimer: 0,
    preloadCursor: 0, idleHandle: 0, framesReadyCount: 0,
    readySet: {}, loadingSet: {}, loadQueue: [], loadQueuedSet: {},
    processActivated: true, desiredFrame: forced < 0 ? 0 : forced,
    displayedFrame: 0, frameBuffers: [], progressCurrent: 0,
    motionToggle: null, root: { setAttribute() {}, classList: { contains: () => readable } },
    journey: { getBoundingClientRect: () => ({ width: rendered ? 1280 : 0, height: rendered ? 720 : 0 }) },
    viewport: {}, params: { get: () => readQuery ? 'read' : null },
    window: { matchMedia: () => ({ matches: shortScreen }) },
    cancelMobileGlide() {}, journeyOwnsViewport: () => false,
    sampleScroll() {}, paint() {}, syncArrivalMotion() {},
    setLoader() {}, openingNeighborhoodReady: () => 1,
    frameInPresentRange: () => false,
    selectPresentableFrame: () => 0, clearPendingPresent() {},
    clamp: (n, min, max) => Math.max(min, Math.min(n, max)),
    mobileProgressToFrame: (p) => Math.round(p * 360),
    loadFrame(i, priority) {
      if (!context.worldLoadUnlocked && i !== context.forcedEntryFrame) return;
      if (context.readySet[i] || context.loadingSet[i]) return;
      context.loadingSet[i] = true;
      requests.push({ i, priority });
    }
  };
  const schedule = (fn) => { const handle = ++nextHandle; callbacks.set(handle, fn); return handle; };
  const cancel = (handle) => { cancelled.push(handle); callbacks.delete(handle); };
  context.window.setTimeout = schedule;
  context.window.clearTimeout = cancel;
  if (idleApi) {
    context.window.requestIdleCallback = schedule;
    context.window.cancelIdleCallback = cancel;
  }
  vm.createContext(context);
  vm.runInContext(`var PROCESS_TUNING = ${tuningMatch[1]};\n${source}`, context);
  function flush(limit = 100) {
    let count = 0;
    while (callbacks.size) {
      assert.ok(++count < limit, 'background scheduler terminates');
      const [handle, fn] = callbacks.entries().next().value;
      callbacks.delete(handle);
      fn();
    }
  }
  return { c: context, requests, callbacks, cancelled, flush };
}

const checks = [];
function check(name, fn) { fn(); checks.push(name); console.log(`PASS ${name}`); }
const sortedFrames = (requests) => requests.map((r) => r.i).sort((a, b) => a - b);
const stills = [0, 108, 180, 312, 360];

check('motion off loads the five authored stills only', () => {
  const { c, requests, callbacks } = setup({ motionOn: false });
  c.bootPreload();
  c.showFrame(180);
  c.scheduleIdlePreload();
  c.preloadBatch();
  assert.deepEqual(sortedFrames(requests), stills);
  assert.equal(callbacks.size, 0);
});

check('normal full motion retains the complete 361-frame background sequence', () => {
  const { c, requests, flush } = setup();
  c.bootPreload();
  flush();
  assert.equal(new Set(requests.map((r) => r.i)).size, 361);
});

check('Save-Data suppresses full idle loading but preserves requested motion neighbors', () => {
  const { c, requests, callbacks } = setup({ saveData: true });
  c.bootPreload();
  assert.ok(requests.length < 50);
  assert.ok(requests.some((r) => r.i === 23));
  assert.equal(callbacks.size, 0);
  c.showFrame(90);
  for (let i = 82; i <= 98; i++) assert.ok(requests.some((r) => r.i === i));
  c.preloadBatch();
  assert.equal(callbacks.size, 0);
});

check('direct entry remains first and exclusively gates background work', () => {
  const { c, requests, callbacks, flush } = setup({ forced: 180 });
  c.bootPreload();
  c.applyMotionPreference(true, false);
  assert.deepEqual(sortedFrames(requests), [180]);
  assert.equal(callbacks.size, 0);
  c.markReady(180);
  assert.equal(c.worldLoadUnlocked, true);
  flush();
  assert.equal(new Set(requests.map((r) => r.i)).size, 361);
});

check('direct motion-off entry completion unlocks only required stills', () => {
  const { c, requests, callbacks } = setup({ motionOn: false, forced: 180 });
  c.bootPreload();
  assert.deepEqual(sortedFrames(requests), [180]);
  c.markReady(180);
  assert.deepEqual(sortedFrames(requests), stills);
  assert.equal(callbacks.size, 0);
});

check('pausing before a direct-entry image completes does not start background motion loads', () => {
  const { c, requests, callbacks } = setup({ forced: 180 });
  c.bootPreload();
  c.applyMotionPreference(false, false);
  assert.deepEqual(sortedFrames(requests), [180]);
  c.markReady(180);
  assert.deepEqual(sortedFrames(requests), stills);
  assert.equal(callbacks.size, 0);
});

for (const idleApi of [true, false]) {
  check(`motion pause cancels ${idleApi ? 'idle callback' : 'timeout'} and removes queued speculation`, () => {
    const { c, requests, callbacks, cancelled } = setup({ idleApi });
    c.bootPreload();
    const staleCallback = callbacks.values().next().value;
    c.loadQueue = [{ i: 81, priority: false }, { i: 181, priority: true }];
    c.loadQueuedSet = { 81: 1, 181: 1 };
    c.applyMotionPreference(false, false);
    assert.equal(callbacks.size, 0);
    assert.equal(cancelled.length, 1);
    assert.deepEqual(c.loadQueue.map((job) => job.i), [181]);
    assert.equal(c.loadQueuedSet[81], undefined);
    assert.equal(c.preloadCursor, 0);
    const count = requests.length;
    staleCallback();
    c.markReady(0);
    assert.equal(requests.length, count, 'stale callbacks/in-flight completions add no speculation');
    assert.equal(callbacks.size, 0);
  });
}

check('motion on resumes the discarded scan without losing frames', () => {
  const { c, requests, callbacks, flush } = setup({ motionOn: false });
  c.bootPreload();
  c.applyMotionPreference(true, false);
  assert.ok(callbacks.size > 0);
  flush();
  assert.equal(new Set(requests.map((r) => r.i)).size, 361);
});

check('a scan that reached the end before pause restarts when motion returns', () => {
  const { c, requests, flush } = setup();
  c.preloadCursor = 361;
  c.loadQueue = [{ i: 81, priority: false }];
  c.loadQueuedSet = { 81: 1 };
  c.applyMotionPreference(false, false);
  assert.equal(c.loadQueue.length, 0);
  c.applyMotionPreference(true, false);
  flush();
  assert.equal(new Set(requests.map((r) => r.i)).size, 361);
});

check('toggle back on still respects Save-Data', () => {
  const { c, requests, callbacks } = setup({ motionOn: false, saveData: true });
  c.bootPreload();
  c.applyMotionPreference(true, false);
  assert.equal(callbacks.size, 0);
  assert.deepEqual(sortedFrames(requests), stills);
  c.showFrame(90);
  assert.ok(requests.some((r) => r.i === 90 && r.priority));
});

check('Save-Data enabled before a pending callback prevents its next idle batch', () => {
  const { c, requests, flush } = setup();
  c.bootPreload();
  const count = requests.length;
  c.navigator.connection.saveData = true;
  flush();
  assert.equal(requests.length, count);
});

check('browsers without Network Information API preserve full motion behavior', () => {
  const { c, requests, flush } = setup();
  delete c.navigator.connection;
  c.bootPreload();
  flush();
  assert.equal(new Set(requests.map((r) => r.i)).size, 361);
});

for (const mode of [{ readable: true }, { readQuery: true }, { shortScreen: true }, { rendered: false }]) {
  check(`hidden Process rejects idle and presentation work: ${Object.keys(mode)[0]}`, () => {
    const { c, requests, callbacks } = setup(mode);
    assert.equal(c.processIsRendered(), false);
    c.scheduleIdlePreload();
    c.preloadBatch();
    c.showFrame(180);
    c.applyMotionPreference(true, false);
    c.markReady(0);
    assert.equal(requests.length, 0);
    assert.equal(callbacks.size, 0);
  });
}

console.log(JSON.stringify({ sourcePath, passed: checks.length, checks }, null, 2));
