#!/usr/bin/env node
/**
 * Focused structural/behavior test for the Work passage visual oracle.
 * Filesystem + HTML assertions (no network). Does not replace smoke-test.mjs.
 *
 * Activation: node work-smoke-test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

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
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const rootHtmlBuf = mustExist('index.html');
const rootHtml = rootHtmlBuf ? rootHtmlBuf.toString('utf8') : '';
const workHtmlBuf = mustExist('work/index.html');
const workHtml = workHtmlBuf ? workHtmlBuf.toString('utf8') : '';

// Root: Work route on scripted header + no-JS path + exit transition
ok(/id="work-link"[^>]*href="work\/"/.test(rootHtml) || /href="work\/"[^>]*id="work-link"/.test(rootHtml), 'scripted header Work link');
ok(rootHtml.includes('class="work-link"') && rootHtml.includes('href="work/"'), 'Work link class + href present');
ok(/no-js-route[\s\S]*href="work\/"/.test(rootHtml), 'no-JS path includes Work route');
ok(rootHtml.includes('data-work-exit') && rootHtml.includes('work-exit-veil'), 'authored Work exit transition');
ok(rootHtml.includes('jw-work-enter'), 'exit hands enter flag to Work route');
ok(/min-height:\s*44px/.test(rootHtml) && rootHtml.includes('.work-link'), 'Work link 44px target styling');
ok(rootHtml.includes('tauDesktopSec: 0.41') && rootHtml.includes('tauMobileSec: 0.41'), 'root TAU remains 0.41');
ok(rootHtml.includes('CNAME') || fs.existsSync(path.join(ROOT, 'CNAME')), 'CNAME preserved on disk');
const cname = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
ok(cname === 'jarrettwroten.com', 'CNAME content unchanged');

// Work page: visible words only
const requiredPhrases = [
  'Jarrett Wroten',
  'Work',
  'Motion on',
  'Rana Levy',
  'Custom gems turn heads.',
  'Visit the live site',
  'Dylan Prorok',
  'Independent redesign concept',
  'Independent redesign concept—not commissioned or approved by Dylan Prorok.',
  'Back to Jarrett',
];
for (const phrase of requiredPhrases) {
  ok(workHtml.includes(phrase), 'work copy: ' + phrase);
}

// Forbidden relationship labels attached to Rana (ProRok may use redesign/concept)
const ranaBlocks = [...workHtml.matchAll(/Rana Levy[\s\S]{0,280}/g)].map((m) => m[0]);
ok(ranaBlocks.length >= 1, 'Rana name appears in work page');
ok(
  ranaBlocks.every((block) => !/\b(commissioned|client work|collaboration)\b/i.test(block)),
  'Rana not labeled commissioned/client/collaboration'
);
ok(
  !/Rana Levy[^.]{0,80}\b(redesign|concept)\b/i.test(workHtml),
  'Rana not labeled redesign/concept'
);

// Links
ok(workHtml.includes('https://rana.jarrettwroten.com/'), 'Rana live site URL');
ok(/href="\.\.\/"/.test(workHtml) && workHtml.includes('Back to Jarrett'), 'route back home');
ok(!/href=["']#["']/.test(workHtml), 'no dead hash-only links');

// Media wiring — local only, real posters, ambient video attrs
ok(workHtml.includes('../assets/work/rana/studio-banner.mp4'), 'studio video path');
ok(workHtml.includes('../assets/work/rana/ring-alexandrite.mp4'), 'ring video path');
ok(workHtml.includes('../assets/work/rana/studio-poster.jpg'), 'studio poster');
ok(workHtml.includes('../assets/work/rana/studio-opening.jpg'), 'studio opening still');
ok(workHtml.includes('../assets/work/rana/ring-poster.jpg'), 'ring poster');
ok(workHtml.includes('../demos/dylan-prorok/dylan-portrait.jpg'), 'ProRok portrait reused');
ok(workHtml.includes('../demos/dylan-prorok/sakura-ink-bloom.mp4'), 'ProRok ink video reused');
ok(workHtml.includes('../assets/golden-arrival/frames/ga-000.webp'), 'corridor entry frame');
ok(/autoplay\s+muted\s+loop\s+playsinline\s+preload="metadata"/.test(workHtml), 'ambient video attributes');
ok(!/src=["']https?:\/\//i.test(workHtml), 'no remote script/media src on work route');
ok(!/fonts\.gstatic\.com|fonts\.googleapis\.com/i.test(workHtml), 'no external font CDN');

// Motion contract
ok(workHtml.includes('jw-motion') && workHtml.includes('data-motion'), 'motion preference wiring');
ok(/var TAU = 0\.41/.test(workHtml) || /TAU\s*=\s*0\.41/.test(workHtml), 'work route TAU = 0.41');
ok(workHtml.includes('Math.exp(-dt') || workHtml.includes('Math.exp(-dt /'), 'single time-constant smoothing');
ok(workHtml.includes('data-motion="off"') || workHtml.includes("data-motion\", on ?"), 'motion-off path present');
ok(workHtml.includes('clip-path') || workHtml.includes('-webkit-clip-path'), 'spatial clip-path reveal');
ok(workHtml.includes('no-js-route'), 'no-JS fallback on work route');

// Composition anti-patterns (markup-level)
ok(!/<iframe\b/i.test(workHtml), 'no iframe embeds');
ok(!/browser mockup|device frame|carousel|modal preview/i.test(workHtml), 'no mockup/carousel language');

// Assets present with frozen hashes (Rana staged bytes)
const ranaHashes = {
  'assets/work/rana/ring-alexandrite.mp4': 'cedccbe95341ff61fc4a961344c9d8fd4422272d2a1dab561bfe38d718cff850',
  'assets/work/rana/ring-poster.jpg': 'b278dcbee501a9ac28638b03c5eeabeba0d243f9f8e10707fbe299641d0961bb',
  'assets/work/rana/studio-banner.mp4': '118dd56a04f8f5fddceac858260811d3f490fea5cad1491a887dafcf1bc6d589',
  'assets/work/rana/studio-opening.jpg': 'acf2e2035a37ba771b3ba95c5d1a5e678189767205cea52034e0df3da51cac96',
  'assets/work/rana/studio-poster.jpg': 'd0f53b3b8da6aa7aaa0da53eb5a44f76b28496523d77580744cf59b3fba5c8f6',
};
for (const [rel, expected] of Object.entries(ranaHashes)) {
  const buf = mustExist(rel);
  if (buf) ok(sha256(buf) === expected, rel + ' SHA-256');
}
const prorokPortrait = mustExist('demos/dylan-prorok/dylan-portrait.jpg');
const prorokInk = mustExist('demos/dylan-prorok/sakura-ink-bloom.mp4');
if (prorokPortrait) {
  ok(sha256(prorokPortrait) === '3c6eb7e4d23aca8e5bcf0784c934346a392d2421f28420699bd681aa99dfc397', 'dylan-portrait.jpg SHA-256');
}
if (prorokInk) {
  ok(sha256(prorokInk) === 'ea5f0185d7a7086d24803194237716f73de06996d70689c777ef513354f5b467', 'sakura-ink-bloom.mp4 SHA-256');
}
// Do not duplicate ProRok binaries under work/
ok(!fs.existsSync(path.join(ROOT, 'work/dylan-portrait.jpg')), 'no duplicated dylan portrait under work/');
ok(!fs.existsSync(path.join(ROOT, 'work/sakura-ink-bloom.mp4')), 'no duplicated ink video under work/');

// Type system inheritance
ok(/font-family:"Bodoni Moda"/.test(workHtml.replace(/\s+/g, '')) || workHtml.includes('font-family:"Bodoni Moda"'), 'Bodoni wired');
ok(workHtml.includes('IBM Plex Sans') && workHtml.includes('Rana Reader Fallback'), 'IBM + Rana reader wired');
ok(!/text-transform\s*:\s*uppercase/i.test(workHtml), 'no faux-technical uppercase');
ok(!/IBM Plex Mono|--mono\s*:/.test(workHtml), 'no mono register');

// JS parse check for work page inline script (extract and Function-wrap)
const scripts = [...workHtml.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
let parsed = 0;
for (const m of scripts) {
  const body = m[1].trim();
  if (!body) continue;
  try {
    // eslint-disable-next-line no-new-func
    new Function(body);
    parsed++;
  } catch (e) {
    failures.push('work inline script parse: ' + e.message);
  }
}
ok(parsed >= 2, 'work inline scripts parse (' + parsed + ')');

// node --check on this test file and smoke-test remain runnable
const selfCheck = spawnSync(process.execPath, ['--check', path.join(ROOT, 'work-smoke-test.mjs')], { encoding: 'utf8' });
ok(selfCheck.status === 0, 'work-smoke-test.mjs syntax');

if (failures.length) {
  console.error('\nFAIL ' + failures.length);
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('\nAll work passage checks passed.');
