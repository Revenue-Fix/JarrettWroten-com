#!/usr/bin/env node
/**
 * Focused structural/behavior test for the complete Work passage.
 * Filesystem + HTML assertions (no network). Does not replace smoke-test.mjs.
 * Run: node work-smoke-test.mjs
 * Future consumer: every local Work-route revision before adoption or publication.
 * Retire only when the Work route is retired or these boundaries move intact to its successor suite.
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

// Public Work route must not ship a restrictive robots ban
ok(!/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(workHtml), 'work route has no robots=noindex');
ok(!/content=["']noindex["']/i.test(workHtml), 'work route has no noindex content');

// Work page: owner-approved copy anchors + chrome
const requiredPhrases = [
  'Jarrett Wroten',
  'Work',
  'Motion on',
  'Scroll',
  'Rana Levy',
  'Rana cuts each stone by hand. So I built the site around the hand, the cut, and the way a gem changes in the light.',
  'Ready Now',
  'Made To Order',
  'Custom Consultation',
  'Visit the live site',
  'Dylan Prorok',
  'A large tattoo has to work with the body and still read from across the room. I built the concept around scale, body flow, and the choice to start a long project.',
  'Work in progress — currently being revised with Dylan Prorok.',
  'Visit the concept',
  'Your site should feel like your work.',
  'Send me your site. I’ll find the first place the path breaks and show you what I’d change.',
  'Send me your site',
  'Book a call',
  'Back to Jarrett',
];
for (const phrase of requiredPhrases) {
  ok(workHtml.includes(phrase), 'work copy: ' + phrase);
}
// Redundant Rana support sentence removed — path labels carry the three routes alone
ok(
  !workHtml.includes('Ready Now, Made To Order, and Custom Consultation stay clear without pulling you out of the world.'),
  'Rana support sentence not repeated beside path labels'
);

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
// ProRok honesty: current collaboration-in-revision truth; no stronger status claims.
const DYLAN_TRUTH = 'Work in progress — currently being revised with Dylan Prorok.';
const DYLAN_OLD = 'Independent redesign concept—not commissioned or approved by Dylan Prorok.';
ok(workHtml.includes(DYLAN_TRUTH), 'rendered Work page carries exact Dylan revision truth');
ok(!workHtml.includes(DYLAN_OLD), 'old Dylan independent-disclaimer is retired');
{
  const noJs = (workHtml.match(/id="no-js-route"[\s\S]*?<\/main>/i) || [''])[0];
  ok(noJs.includes(DYLAN_TRUTH), 'no-JS Work consumer carries exact Dylan revision truth');
  ok(!noJs.includes(DYLAN_OLD), 'no-JS Work consumer rejects old Dylan disclaimer');
}
ok(!/\bhealed[- ]work\b/i.test(workHtml), 'no healed-work claim');
ok(!/\bcommissioned\b/i.test(workHtml), 'no commissioned claim');
ok(!/\bapproved\b/i.test(workHtml), 'no approved claim');
ok(!/\bclient work\b/i.test(workHtml), 'no client-work claim');
// Stronger status claims as relationship language near Dylan/ProRok (not incidental CSS words).
ok(
  !/\b(Dylan Prorok|ProRok)\b[\s\S]{0,160}\b(finished|complete|deployed|commissioned|approved)\b/i.test(workHtml) &&
    !/\b(finished|complete|deployed|commissioned|approved)\b[\s\S]{0,160}\b(Dylan Prorok|ProRok)\b/i.test(workHtml),
  'no finished/complete/deployed/commissioned/approved claim attached to Dylan/ProRok'
);
ok(
  !/\b(Dylan Prorok|ProRok)\b[^.]{0,120}\b(approved|commissioned|hired|client)\b/i.test(workHtml),
  'no ProRok approval/commission/client implication'
);
ok(
  /currently being revised with Dylan Prorok/.test(workHtml) &&
    !/currently being revised by Dylan Prorok/.test(workHtml),
  'Dylan revision truth uses with, not by'
);

// Links — four external actions + home
ok(workHtml.includes('https://rana.jarrettwroten.com/'), 'Rana live site URL');
ok(workHtml.includes('https://prorok.jarrettwroten.com/'), 'ProRok concept URL');
ok(/href=["']mailto:Jarrett@JarrettWroten\.com["']/.test(workHtml), 'direct mailto action');
ok(workHtml.includes('https://calendar.app.google/rTkdNoWpm6iRrXhB7'), 'booking URL');
ok(/href="\.\.\/"/.test(workHtml) && workHtml.includes('Back to Jarrett'), 'route back home');
ok(!/href=["']#["']/.test(workHtml), 'no dead hash-only links');
ok(!/<form\b/i.test(workHtml), 'no email form — mailto + booking only');

// No-JS truth path: identity → Rana → ProRok disclosure → terminal, with all four actions
const noJsMatch = workHtml.match(/id="no-js-route"[\s\S]*?<\/main>/i);
ok(!!noJsMatch, 'no-JS route block present');
if (noJsMatch) {
  const noJs = noJsMatch[0];
  const markers = [
    'Jarrett Wroten',
    'Rana Levy',
    'Ready Now',
    'https://rana.jarrettwroten.com/',
    'Dylan Prorok',
    'https://prorok.jarrettwroten.com/',
    'Work in progress — currently being revised with Dylan Prorok.',
    '../assets/golden-arrival/frames/ga-360.webp',
    'Your site should feel like your work.',
    'mailto:Jarrett@JarrettWroten.com',
    'https://calendar.app.google/rTkdNoWpm6iRrXhB7',
  ];
  let last = -1;
  let orderOk = true;
  for (const m of markers) {
    const at = noJs.indexOf(m);
    if (at < 0 || at < last) {
      orderOk = false;
      failures.push('no-JS word/action order missing or out of order: ' + m);
      break;
    }
    last = at;
  }
  if (orderOk) ok(true, 'no-JS readable order + four external actions');
}

// Media wiring — local only, real posters, ambient video attrs
ok(workHtml.includes('../assets/work/rana/studio-banner.mp4'), 'studio video path');
ok(workHtml.includes('../assets/work/rana/ring-alexandrite.mp4'), 'ring video path');
ok(workHtml.includes('../assets/work/rana/studio-poster.jpg'), 'studio poster');
ok(workHtml.includes('../assets/work/rana/studio-opening.jpg'), 'studio opening still');
ok(workHtml.includes('../assets/work/rana/ring-poster.jpg'), 'ring poster');
ok(workHtml.includes('../demos/dylan-prorok/dylan-portrait.jpg'), 'ProRok portrait reused');
ok(workHtml.includes('../demos/dylan-prorok/sakura-ink-bloom.mp4'), 'ProRok ink video reused');
ok(workHtml.includes('../assets/golden-arrival/frames/ga-000.webp'), 'corridor entry frame');
ok(workHtml.includes('../assets/work/corridor-entry-loop.mp4'), 'corridor entry motion path');
ok(/autoplay\s+muted\s+loop\s+playsinline\s+preload="auto"/.test(workHtml), 'ambient video attributes');
ok(
  /id="corridor-motion-video"[\s\S]*?autoplay\s+muted\s+loop\s+playsinline\s+preload="auto"/.test(workHtml) &&
    /id="rana-studio-video"[\s\S]*?autoplay\s+muted\s+loop\s+playsinline\s+preload="auto"/.test(workHtml) &&
    /id="rana-ring-video"[\s\S]*?autoplay\s+muted\s+loop\s+playsinline\s+preload="auto"/.test(workHtml) &&
    /id="prorok-ink-video"[\s\S]*?autoplay\s+muted\s+loop\s+playsinline\s+preload="auto"/.test(workHtml),
  'corridor, both Rana videos, and ProRok autoplay muted inline with eager local preload'
);
ok(!/src=["']https?:\/\//i.test(workHtml), 'no remote script/media src on work route');
ok(!/fonts\.gstatic\.com|fonts\.googleapis\.com/i.test(workHtml), 'no external font CDN');

// Motion contract + terminal rest mapping
ok(workHtml.includes('jw-motion') && workHtml.includes('data-motion'), 'motion preference wiring');
ok(/var TAU = 0\.41/.test(workHtml) || /TAU\s*=\s*0\.41/.test(workHtml), 'work route TAU = 0.41');
ok(workHtml.includes('Math.exp(-dt') || workHtml.includes('Math.exp(-dt /'), 'single time-constant smoothing');
ok(workHtml.includes('data-motion="off"') || workHtml.includes("data-motion\", on ?"), 'motion-off path present');
ok(workHtml.includes('terminalHold') && workHtml.includes('--terminal-hold'), 'terminal progress mapping');
ok(workHtml.includes('layer-terminal') && workHtml.includes('copy-terminal'), 'terminal world + copy rest');
ok(
  /class="terminal-return"\s+id="terminal-return"\s+src="\.\.\/assets\/golden-arrival\/frames\/ga-360\.webp"/.test(workHtml),
  'terminal resolves to approved Jarrett close-up'
);
// Focused tripwire — canonical: work-smoke-test.mjs; consumer/activation: Work release
// preflight executes `node work-smoke-test.mjs`; check: native-scale headroom plus no central
// amber mouth cast; retire when the terminal portrait carrier is replaced.
ok(
  /\.terminal-return\s*\{[\s\S]*?object-position\s*:\s*45% 0%[\s\S]*?transform\s*:\s*scale\(calc\(1\.08 - var\(--terminal-hold\) \* \.08\)\)/.test(workHtml),
  'terminal portrait preserves headroom and settles to native scale'
);
ok(
  /html\[data-motion="off"\] \.terminal-return\s*\{[\s\S]*?transform\s*:\s*scale\(1\)/.test(workHtml),
  'motion-off terminal portrait remains at native scale'
);
ok(
  !workHtml.includes('at 50% 62%, rgba(217,122,58,.34)') &&
    !workHtml.includes('at 50% 64%, rgba(217,122,58,.32)'),
  'terminal arrival glows do not cross Jarrett mouth and beard'
);
ok(
  /class="scroll-invitation"[\s\S]*?<span>Scroll<\/span>/.test(workHtml) &&
    /--entry-cue/.test(workHtml),
  'centered Scroll invitation is mapped to entry progress'
);
ok(
  /\.layer-terminal\s*\{[\s\S]*?--mask-open\s*:\s*max\s*\(\s*0\.001\s*,\s*var\(--terminal-hold\)\s*\)/.test(workHtml),
  'terminal uses spatial mask aperture (not opacity primary)'
);
ok(
  !/\.layer-terminal\s*\{[^}]*opacity\s*:\s*var\(--terminal-hold\)/.test(workHtml),
  'terminal layer is not an opacity crossfade'
);
ok(
  /Motion-off snaps to four composed rests/i.test(workHtml) ||
    (workHtml.includes('terminalHold = 1') && workHtml.includes('terminalHold = 0')),
  'motion-off includes terminal composed rest'
);
ok(
  !/clip-path\s*:\s*inset\(/.test(workHtml) &&
    !/-webkit-clip-path\s*:\s*inset\(/.test(workHtml) &&
    !/class="handoff-seam"/.test(workHtml) &&
    !/--carrier-erase/.test(workHtml),
  'rejected straight clip-path inset split-screen grammar is gone'
);
ok(
  !/id="passage-veil"/.test(workHtml) &&
    !/--passage-veil/.test(workHtml) &&
    !/\.passage-veil/.test(workHtml) &&
    !/passageVeil/.test(workHtml) &&
    !/clearPassageVeil/.test(workHtml) &&
    !/linear-gradient\(168deg, #0a1a20/.test(workHtml),
  'rejected passage-veil markup, variable, and blurred-field recipe are absent'
);
// Zero-state reveal gate + nonzero mask floor (structural; not pixel proof).
// Prevents Chromium multi-mask radial-gradient(0% 0% ...) covering the corridor.
ok(
  /--mask-open\s*:\s*max\s*\(\s*0\.001\s*,\s*var\(--(?:rana|prorok)-open\)\s*\)/.test(workHtml) &&
    (workHtml.match(/--mask-open\s*:\s*max\s*\(\s*0\.001\s*,/g) || []).length >= 2,
  'nonzero mask radius floor on both reveal layers'
);
ok(
  /\.layer-rana\s*\{[\s\S]*?visibility\s*:\s*hidden/.test(workHtml) &&
    /\.layer-prorok\s*\{[\s\S]*?visibility\s*:\s*hidden/.test(workHtml) &&
    /\.layer-rana\.is-revealing\s*\{\s*visibility\s*:\s*visible\s*\}/.test(workHtml) &&
    /\.layer-prorok\.is-revealing\s*\{\s*visibility\s*:\s*visible\s*\}/.test(workHtml) &&
    /classList\.toggle\s*\(\s*["']is-revealing["']\s*,\s*(?:ranaOpen|prorokOpen)\s*>\s*0\s*\)/.test(workHtml) &&
    (workHtml.match(/classList\.toggle\s*\(\s*["']is-revealing["']/g) || []).length >= 2,
  'zero-state reveal gate (visibility + is-revealing class) on both layers'
);
ok(workHtml.includes('scrollbar-width:none') || workHtml.includes('scrollbar-width: none'), 'native scrollbar hidden');
ok(workHtml.includes('gradeNightInk') || workHtml.includes('url(#gradeNightInk)'), 'ProRok night-ink media grade');
ok(/aria-label="Back to Jarrett"/.test(workHtml), 'wordmark accessible back label');
ok(workHtml.includes('no-js-route'), 'no-JS fallback on work route');
ok(/\.no-js-poster\s*\{[\s\S]*?height\s*:\s*auto/.test(workHtml), 'no-JS media preserves intrinsic aspect ratio');
ok(workHtml.includes('min-height:44px') || workHtml.includes('min-height: 44px'), '44px touch targets present');
// Mobile Rana rest: square ring film is the full-bleed subject carrier so landscape
// studio cover-crops cannot leave only a dark material field + residual badge.
ok(
  /@media\s*\(\s*max-width\s*:\s*720px\s*\)[\s\S]*?\.rana-ring-stage\s*\{[\s\S]*?width\s*:\s*100%[\s\S]*?height\s*:\s*100%/.test(workHtml) &&
    /@media\s*\(\s*max-width\s*:\s*720px\s*\)[\s\S]*?\.rana-ring-stage\s*\{[\s\S]*?mix-blend-mode\s*:\s*normal/.test(workHtml) &&
    /@media\s*\(\s*max-width\s*:\s*720px\s*\)[\s\S]*?subject carrier/.test(workHtml),
  'mobile Rana ring stage is full-bleed subject carrier (not residual badge)'
);

// Composition anti-patterns (markup-level)
ok(!/<iframe\b/i.test(workHtml), 'no iframe embeds');
ok(!/browser mockup|device frame|carousel|modal preview/i.test(workHtml), 'no mockup/carousel language');
ok(!/portfolio|case study|design award|award-winning/i.test(workHtml), 'no portfolio jargon');

// Assets present with frozen hashes (updated only when media bytes legitimately change)
const ranaHashes = {
  'assets/work/rana/ring-alexandrite.mp4': '8b06c43165b2f309005bc62d809c15b26bb1f42c5280a3dcdf80fa6438c3ff62',
  'assets/work/rana/ring-poster.jpg': 'a9a6cb9cb033511526667664108d09b5afc56fb793e49ae087d644922e7b5365',
  'assets/work/rana/studio-banner.mp4': '2f1ba8a6b36c18b088dc7286d2a2323c44912e72e2d429aefd84d2679902d0a6',
  'assets/work/rana/studio-opening.jpg': 'f4dba4c922ecbc74f331b92bf678f1f7926604f1311087b7ce158879a7864c68',
  'assets/work/rana/studio-poster.jpg': '17f4762b9d833bbe251e29731d662f582f7755802feaf1d177b72e416e8e15c5',
};
for (const [rel, expected] of Object.entries(ranaHashes)) {
  const buf = mustExist(rel);
  if (buf) ok(sha256(buf) === expected, rel + ' SHA-256');
}
const prorokPortrait = mustExist('demos/dylan-prorok/dylan-portrait.jpg');
const prorokInk = mustExist('demos/dylan-prorok/sakura-ink-bloom.mp4');
// Maintained asset: assets/work/corridor-entry-loop.mp4 auto-loads through
// work/index.html#corridor-motion-video for Work-route visitors. The hash/weight
// assertions below plus the rendered playback probe are its behavioral check.
// Retire it only when an owner-approved moving opening replaces this consumer.
const corridorEntry = mustExist('assets/work/corridor-entry-loop.mp4');
const terminalPortrait = mustExist('assets/golden-arrival/frames/ga-360.webp');
if (prorokPortrait) {
  ok(sha256(prorokPortrait) === '3c6eb7e4d23aca8e5bcf0784c934346a392d2421f28420699bd681aa99dfc397', 'dylan-portrait.jpg SHA-256');
}
if (prorokInk) {
  ok(sha256(prorokInk) === '6c44c0204d994c3a504feecadd5da0ccf070113a8dbf2bfbee195dc8a4fe523d', 'sakura-ink-bloom.mp4 SHA-256');
}
if (corridorEntry) {
  ok(sha256(corridorEntry) === '9a73d9709618212846ffdee29fd20e541bf16767b3a79b829197ad00e2b963f3', 'corridor-entry-loop.mp4 SHA-256');
}
if (terminalPortrait) {
  ok(sha256(terminalPortrait) === '552fba13d339f46bf909735f3b629c5574545fd7626021e7f371d650149bf224', 'ga-360.webp SHA-256');
}
// Media weight gate: heavy autoplay pair must stay well under the prior ~14 MB load
const studioBytes = fs.statSync(path.join(ROOT, 'assets/work/rana/studio-banner.mp4')).size;
const inkBytes = fs.statSync(path.join(ROOT, 'demos/dylan-prorok/sakura-ink-bloom.mp4')).size;
const ringBytes = fs.statSync(path.join(ROOT, 'assets/work/rana/ring-alexandrite.mp4')).size;
const entryBytes = fs.statSync(path.join(ROOT, 'assets/work/corridor-entry-loop.mp4')).size;
ok(studioBytes + inkBytes + ringBytes + entryBytes < 5_500_000, 'autoplay media under 5.5 MB total');
ok(entryBytes < 1_200_000, 'corridor-entry-loop under 1.2 MB');
ok(studioBytes < 3_500_000, 'studio-banner under 3.5 MB');
ok(inkBytes < 600_000, 'sakura-ink-bloom under 600 KB');
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

// Structural: ProRok/terminal copy never double-legible across the handoff sweep
{
  const mapMatch = workHtml.match(/var MAP = \{([\s\S]*?)\};/);
  ok(!!mapMatch, 'MAP object present for opacity sweep');
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function range(p, a, b) { return smoothstep((p - a) / Math.max(0.0001, b - a)); }
  function plateau(p, a, b, c, d) {
    if (p < a) return 0;
    if (p < b) return range(p, a, b);
    if (p < c) return 1;
    if (p < d) return 1 - range(p, c, d);
    return 0;
  }
  // Parse MAP endpoints from source (not hardcoded screenshot values)
  function num(re) {
    const m = workHtml.match(re);
    return m ? Number(m[1]) : NaN;
  }
  const MAP = {
    ranaHold: {
      a: num(/ranaHold:\s*\{\s*a:\s*([0-9.]+)/),
      b: num(/ranaHold:\s*\{[^}]*b:\s*([0-9.]+)/),
      c: num(/ranaHold:\s*\{[^}]*c:\s*([0-9.]+)/),
      d: num(/ranaHold:\s*\{[^}]*d:\s*([0-9.]+)/),
    },
    prorokOpen: {
      a: num(/prorokOpen:\s*\{\s*a:\s*([0-9.]+)/),
      b: num(/prorokOpen:\s*\{[^}]*b:\s*([0-9.]+)/),
    },
    prorokHold: {
      a: num(/prorokHold:\s*\{\s*a:\s*([0-9.]+)/),
      b: num(/prorokHold:\s*\{[^}]*b:\s*([0-9.]+)/),
      c: num(/prorokHold:\s*\{[^}]*c:\s*([0-9.]+)/),
      d: num(/prorokHold:\s*\{[^}]*d:\s*([0-9.]+)/),
    },
    terminalHold: {
      a: num(/terminalHold:\s*\{\s*a:\s*([0-9.]+)/),
      b: num(/terminalHold:\s*\{[^}]*b:\s*([0-9.]+)/),
    },
  };
  ok(
    Object.values(MAP).every((o) => Object.values(o).every((n) => Number.isFinite(n))),
    'MAP endpoints parse as numbers'
  );
  // Opacity contracts from authored CSS
  const prorokFade = /scene-copy--prorok\{[^}]*opacity:calc\(var\(--prorok-hold\)\s*\*\s*max\(0,\s*1\s*-\s*var\(--terminal-hold\)\s*\*\s*2\)\)/.test(
    workHtml.replace(/\s+/g, '')
  ) || /opacity:calc\(var\(--prorok-hold\)\s*\*\s*max\(\s*0\s*,\s*1\s*-\s*var\(--terminal-hold\)\s*\*\s*2\s*\)\)/.test(
    workHtml.replace(/\s+/g, '')
  );
  ok(prorokFade, 'ProRok copy uses terminal-hold * 2 fade (no double-expose)');
  let overlapFails = 0;
  for (let i = 74; i <= 96; i++) {
    const p = i / 100;
    const ranaHold = plateau(p, MAP.ranaHold.a, MAP.ranaHold.b, MAP.ranaHold.c, MAP.ranaHold.d);
    const prorokOpen = range(p, MAP.prorokOpen.a, MAP.prorokOpen.b);
    const prorokHold = plateau(p, MAP.prorokHold.a, MAP.prorokHold.b, MAP.prorokHold.c, MAP.prorokHold.d);
    const terminalHold = range(p, MAP.terminalHold.a, MAP.terminalHold.b);
    const oRana = ranaHold * (1 - prorokOpen * 1.15);
    const oProrok = prorokHold * Math.max(0, 1 - terminalHold * 2);
    const oTerminal = terminalHold;
    const visibles = [oRana, oProrok, oTerminal].filter((o) => o > 0.06).length;
    if (visibles > 1) overlapFails++;
  }
  ok(overlapFails === 0, 'copy opacity sweep p=0.74..0.96: no two blocks > 0.06 (' + overlapFails + ' fails)');
  // Handoff gap: ProRok hold must end at or before terminal hold starts
  ok(MAP.prorokHold.d <= MAP.terminalHold.a + 0.001, 'prorokHold.d <= terminalHold.a (copy handoff gap)');
}

// Structural: keyboard focus tracks authored visibility
ok(workHtml.includes('setCopyAccess'), 'setCopyAccess helper present');
ok(
  /setAttribute\(\s*["']tabindex["']\s*,\s*["']-1["']\s*\)/.test(workHtml) &&
    /removeAttribute\(\s*["']tabindex["']\s*\)/.test(workHtml),
  'tabindex -1/remove toggled for scene links'
);
ok(
  /setCopyAccess\(\s*copyRana/.test(workHtml) &&
    /setCopyAccess\(\s*copyProrok/.test(workHtml) &&
    /setCopyAccess\(\s*copyTerminal/.test(workHtml),
  'all three scene-copy blocks use setCopyAccess'
);
// Poster alt describes shipped still (hands + gemstones), not a fabricated bench claim
ok(
  /alt="Hands wearing gold rings with cut gemstones in the light\."/.test(workHtml),
  'Rana poster alt matches composed still'
);
ok(
  !/alt="Rana Levy at the bench in her gem studio\."/.test(workHtml),
  'old unsupported bench alt retired'
);
// Mobile ProRok portrait is explicitly the subject carrier (not ink-only)
ok(
  /Live mobile ProRok:\s*portrait is the subject carrier/.test(workHtml) ||
    /prorok-portrait\{[\s\S]*?opacity:calc\(\.62 \+ var\(--prorok-hold\)/.test(workHtml),
  'mobile ProRok portrait opacity strengthened'
);
/*
 * Focused tripwire — settled Invitation full-viewport coverage.
 * Canonical path: work-smoke-test.mjs
 * Future consumer: every local Work-route revision before adoption.
 * Activation: execute `node work-smoke-test.mjs`
 * Behavioral check: mobile Invitation is a full-bleed plate, not a tear
 * mask; authored rest (terminalHold >= 1, including Motion Off) does not
 * depend on an animated reveal mask.
 * Retirement: only when the terminal rest no longer uses a full-bleed plate.
 */
{
  const desktopCss = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/)[0];
  const mobileSheet = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/).slice(1).join('\n');
  ok(
    /\.layer-terminal\s*\{[\s\S]*?--mask-open\s*:\s*max\s*\(\s*0\.001\s*,\s*var\(--terminal-hold\)\s*\)/.test(desktopCss),
    'desktop terminal reveal family remains a spatial aperture, not an opacity crossfade'
  );
  ok(
    /\.layer-rana,\s*\.layer-prorok,\s*\.layer-terminal\s*\{[\s\S]*?(?:-webkit-)?mask(?:-image)?\s*:\s*none/.test(mobileSheet),
    'mobile terminal rest is a full-bleed plate with no animated mask'
  );
  ok(
    !/linear-gradient\(to right, transparent calc\(50% - var\(--mask-open\)/.test(mobileSheet) &&
      !/Vertical threshold tear from center/.test(mobileSheet),
    'rejected mobile vertical tear silhouette is gone'
  );

  ok(
    /layerTerminal\.classList\.toggle\s*\(\s*["']is-revealing["']\s*,\s*terminalHold\s*>\s*0\s*\)/.test(workHtml),
    'terminal reveal class still tracks terminalHold > 0'
  );
  ok(
    /layerTerminal\.classList\.toggle\s*\(\s*["']is-settled["']\s*,\s*terminalHold\s*>=\s*1\s*\)/.test(workHtml),
    'settled class is driven by terminalHold >= 1'
  );

  const motionOffPaint = workHtml.match(
    /\/\* Motion-off snaps to four composed rests[\s\S]*?terminalHold\s*=\s*1;[\s\S]*?\n    \}/
  );
  const motionOffSrc = motionOffPaint ? motionOffPaint[0] : '';
  ok(!!motionOffSrc, 'Motion Off composed-rest paint extractable');
  ok(
    /else if\s*\(\s*p\s*<\s*0\.74\s*\)[\s\S]*?else\s*\{[\s\S]*?terminalHold\s*=\s*1/.test(motionOffSrc) &&
      /terminalHold\s*=\s*1/.test(motionOffSrc) &&
      /terminalHold\s*=\s*0/.test(motionOffSrc),
    'Motion Off last rest still assigns terminalHold = 1'
  );
  ok(
    !/\.passage-veil/.test(workHtml) && !/--passage-veil/.test(workHtml),
    'Motion Off has no passage-veil path to depend on'
  );
}

// Live doorway lightning — structural tripwires (not rendered-pixel proof).
// Consumer: visitor at /work/ opening with motion on; Codex exercises rendered motion separately.
{
  const corridorLayerMatch = workHtml.match(
    /id="layer-corridor"[\s\S]*?(?=<div class="layer layer-rana"|id="layer-rana")/
  );
  const corridorLayer = corridorLayerMatch ? corridorLayerMatch[0] : '';
  ok(!!corridorLayer, 'corridor layer markup extractable for lightning checks');
  ok(
    /class="corridor-lightning"/.test(corridorLayer) &&
      /aria-hidden="true"/.test(corridorLayer.match(/<svg[\s\S]*?class="corridor-lightning"[\s\S]*?>/)?.[0] || corridorLayer) &&
      /corridor-lightning[\s\S]*?aria-hidden="true"|aria-hidden="true"[\s\S]*?corridor-lightning/.test(corridorLayer),
    'aria-hidden lightning overlay exists inside corridor layer'
  );
  ok(
    /class="bolt bolt--left"/.test(corridorLayer) && /class="bolt bolt--right"/.test(corridorLayer),
    'both left and right bolt groups exist'
  );
  ok(
    (corridorLayer.match(/class="bolt-charge"/g) || []).length >= 2 &&
      /@keyframes\s+boltChargeTravel/.test(workHtml) &&
      /stroke-dashoffset/.test(workHtml) &&
      /stroke-dasharray/.test(workHtml),
    'charge travel is animated along bolt paths'
  );
  ok(
    /attributeName=["']d["']/.test(corridorLayer) &&
      (corridorLayer.match(/<animate\b[^>]*attributeName=["']d["']/g) || []).length >= 4,
    'bolt geometry has path-morph motion (not only opacity)'
  );
  ok(
    /html\[data-motion=["']off["']\]\s*\.corridor-lightning\s*\{[\s\S]*?display\s*:\s*none/.test(workHtml),
    'motion-off disables/hides the animated lightning overlay'
  );
  ok(
    /html\[data-motion=["']off["']\]\s*\.corridor-motion\s*\{\s*display\s*:\s*none/.test(workHtml) &&
      /corridor-poster|ga-000\.webp/.test(workHtml),
    'motion-off keeps baked corridor still (poster path remains)'
  );
  // Whole-scene flicker falsifier: .corridor-frame must not host a lightning keyframe animation.
  ok(
    !/\.corridor-frame\s*\{[^}]*\banimation\s*:/.test(workHtml) &&
      !/@keyframes\s+[^{]*corridor[^{]*\{[^}]*(opacity|brightness|contrast|filter)/i.test(workHtml),
    'corridor frame has no whole-scene lightning flicker animation'
  );
  ok(
    /viewBox=["']0 0 1280 720["']/.test(corridorLayer) &&
      /preserveAspectRatio=["']xMidYMid slice["']/.test(corridorLayer),
    'lightning overlay is geometry-locked to 1280x720 media cover'
  );
}

/*
 * Focused tripwire — mobile My Work full-interval transitions.
 * Canonical path: work-smoke-test.mjs
 * Future consumer: Codex closer + every local Work-route revision before adoption.
 * Activation: execute `node work-smoke-test.mjs`
 * Behavioral check: four STILL rests; one-gesture / hidden 8000ms readiness
 * ceiling / 960ms visible atomic-canvas handoff / lock; cold-load warms each
 * beat video; a destination is ready only after each required video has a
 * decoded frame; outgoing rest stays painted until that promise resolves;
 * timeout/error/stale tokens cancel without advancing; the visible handoff
 * keeps exactly one authored rest authoritative and cuts on a named phase —
 * no passage-veil, blur plate, dissolve, or third visual; copy exits before
 * the cut and enters after; reverse uses the same readiness rule and cut
 * grammar; landing clears transition state after 960ms; Motion Off
 * immediate; TAU = 0.41. Rejected silhouettes (expanding gem, bottom-up
 * stack, vertical tear, clip-path inset split, cyan/copper veil) stay gone.
 * Retirement: only when the four-rest mobile passage is replaced.
 */
{
  ok(
    /corridor:\s*0\.04/.test(workHtml) &&
      /rana:\s*0\.38/.test(workHtml) &&
      /prorok:\s*0\.70/.test(workHtml) &&
      /terminal:\s*0\.94/.test(workHtml),
    'STILL rests remain corridor 0.04, rana 0.38, prorok 0.70, terminal 0.94'
  );
  ok(
    /MOBILE_STOPS\s*=\s*\[[\s\S]*?id:\s*"corridor"[\s\S]*?STILL\.corridor[\s\S]*?id:\s*"rana"[\s\S]*?STILL\.rana[\s\S]*?id:\s*"prorok"[\s\S]*?STILL\.prorok[\s\S]*?id:\s*"invitation"[\s\S]*?STILL\.terminal/.test(workHtml),
    'mobile stops derive from STILL in Corridor → Rana → ProRok → Invitation order'
  );
  const workStops = [
    ['corridor', 0.04],
    ['rana', 0.38],
    ['prorok', 0.70],
    ['invitation', 0.94],
  ];
  ok(workStops.length === 4, 'exactly four authored mobile rests');
  const nextWorkStop = (index, direction) => Math.max(0, Math.min(workStops.length - 1, index + Math.sign(direction)));
  const forward = [];
  let stopIndex = 0;
  for (let i = 0; i < 5; i++) {
    stopIndex = nextWorkStop(stopIndex, 1);
    forward.push(workStops[stopIndex][0]);
  }
  ok(
    JSON.stringify(forward) === JSON.stringify(['rana', 'prorok', 'invitation', 'invitation', 'invitation']),
    'three forward gestures reach Invitation; further forward stays at Invitation'
  );
  const reverse = [];
  for (let i = 0; i < 5; i++) {
    stopIndex = nextWorkStop(stopIndex, -1);
    reverse.push(workStops[stopIndex][0]);
  }
  ok(
    JSON.stringify(reverse) === JSON.stringify(['prorok', 'rana', 'corridor', 'corridor', 'corridor']),
    'reverse gestures unwind one rest at a time and stay at Corridor'
  );

  ok(
    workHtml.includes('window.addEventListener("touchstart", onMobileTouchStart, { passive: true })') &&
      workHtml.includes('window.addEventListener("touchmove", onMobileTouchMove, { passive: false })') &&
      workHtml.includes('window.addEventListener("touchend", onMobileTouchEnd, { passive: true })') &&
      workHtml.includes('window.addEventListener("touchcancel", onMobileTouchCancel, { passive: true })') &&
      workHtml.includes('window.addEventListener("wheel", onMobileWheel, { passive: false })'),
    'mobile touch and wheel listeners are registered'
  );
  ok(
    /function onMobileTouchEnd\(e\)[\s\S]*?Math\.abs\(dy\) >= MOBILE_SWIPE_THRESHOLD_PX[\s\S]*?advanceMobileStop\(dy < 0 \? 1 : -1\)/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?mobileWheelTriggered[\s\S]*?advanceMobileStop\(mobileWheelDelta > 0 \? 1 : -1\)/.test(workHtml),
    'touch and wheel choose direction once and discard travel magnitude'
  );
  ok(
    /function onMobileTouchMove\(e\)[\s\S]*?absX > absY[\s\S]*?resetMobileTouch\(\)/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?Math\.abs\(e\.deltaX\) > Math\.abs\(e\.deltaY\)[\s\S]*?return;/.test(workHtml),
    'horizontal gestures do not navigate'
  );

  ok(
    workHtml.includes('mobileGlideLocked') &&
      workHtml.includes('mobileWaiting') &&
      /function mobileNavigationBusy\(\)[\s\S]*?return mobileGlideLocked \|\| mobileWaiting/.test(workHtml) &&
      /function advanceMobileStop\(direction\)[\s\S]*?if \(!isMobile\(\) \|\| mobileNavigationBusy/.test(workHtml) &&
      /function onMobileTouchStart\(e\)[\s\S]*?mobileNavigationBusy/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?if \(!mobileNavigationBusy\(\)\) advanceMobileStop/.test(workHtml),
    'pending readiness and the authored glide both block further stop-skipping fragments'
  );

  ok(
    /var MOBILE_BREAKPOINT_PX = 720/.test(workHtml) &&
      workHtml.includes('matchMedia("(max-width:" + MOBILE_BREAKPOINT_PX + "px)")') &&
      /function mobileGestureAvailable\(\)[\s\S]*?return isMobile\(\) && !!passage && !!viewport/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?if \(!mobileGestureAvailable\(\)\) return;[\s\S]*?e\.preventDefault\(\)/.test(workHtml),
    'section lock is gated to the 720px mobile query before any wheel trap'
  );
  ok(
    /function onMobileViewportChange\(\)[\s\S]*?cancelMobileGlide\(\)/.test(workHtml) &&
      /mobileMq\.addEventListener\("change", onMobileViewportChange\)/.test(workHtml),
    'leaving mobile cancels the authored glide and restores ordinary scroll ownership'
  );

  ok(
    /function scrollToMobileStopIndex\(index\)[\s\S]*?behavior:\s*"auto"/.test(workHtml) &&
      /function glideScrollTo\(top\)[\s\S]*?if \(!motionOn \|\| Math\.abs\(distance\) < 0\.5\)[\s\S]*?window\.scrollTo\(0, top\)/.test(workHtml),
    'Motion Off lands on the same four stops immediately without an animated glide'
  );

  const desktopCss = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/)[0];
  ok(!/scroll-snap(?:-type|-align|-stop)?\s*:/.test(workHtml), 'no CSS scroll-snap');
  ok(!/touch-action\s*:/.test(desktopCss), 'desktop CSS does not lock touch-action');
  ok(
    /@media\s*\(\s*max-width\s*:\s*720px\s*\)[\s\S]*?touch-action\s*:\s*pan-x pinch-zoom/.test(workHtml),
    'mobile-only touch-action owns vertical travel while leaving pinch and horizontal free'
  );
  ok(
    /Keyboard depth without trapping/.test(workHtml) &&
      /viewport\.offsetHeight \* \(e\.key === "PageDown" \|\| e\.key === "PageUp" \? 0\.85 : 0\.22\)/.test(workHtml) &&
      !/function \(e\) \{\s*if \(e\.target && \(e\.target\.tagName === "INPUT"[\s\S]*?advanceMobileStop/.test(workHtml),
    'keyboard depth remains free-step and is not remapped onto the mobile lock'
  );

  ok(/var TAU = 0\.41/.test(workHtml), 'work route TAU remains 0.41 after section lock');
  ok((workHtml.match(/Math\.exp\(-dt/g) || []).length === 1, 'exactly one exponential smoothing clock remains');
  ok(
    /if \(!motionOn \|\| isMobile\(\)\) \{\s*progressCurrent = progressTarget;/.test(workHtml) &&
      /var eased\s*=\s*smoothstep\(elapsed\)/.test(workHtml) &&
      /function smoothstep\(t\)/.test(workHtml) &&
      !/var eased\s*=\s*smootherStep\(elapsed\)/.test(workHtml) &&
      !/function smootherStep\(t\)/.test(workHtml) &&
      workHtml.includes('zero-velocity departure') &&
      workHtml.includes('zero-velocity landing'),
    'the authored section glide is the only mobile smoothing clock'
  );

  ok(
    /function isInteractiveOrigin\(e\)[\s\S]*?closest\("a, button, input, select, textarea, \[contenteditable\]/.test(workHtml) &&
      /function onMobileTouchStart\(e\)[\s\S]*?isInteractiveOrigin\(e\)/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?isInteractiveOrigin\(e\)/.test(workHtml) &&
      /function isOpenOverlay\(\)[\s\S]*?aria-modal/.test(workHtml),
    'touch/wheel that begins on controls or an open overlay is not hijacked'
  );
  ok(
    /window\.WORK_PASSAGE = \{[\s\S]*?mobileStopIndex[\s\S]*?mobileGliding[\s\S]*?mobileWaiting[\s\S]*?mobileRequestedStop[\s\S]*?goMobileStop:\s*scrollToMobileStopIndex/.test(workHtml) &&
      /get mobileTransition\(\) \{[\s\S]*?fromIndex[\s\S]*?toIndex[\s\S]*?t:/.test(workHtml) &&
      /get videoReadiness\(\) \{[\s\S]*?corridor:[\s\S]*?studio:[\s\S]*?ring:[\s\S]*?ink:/.test(workHtml) &&
      /readinessMs:\s*MOBILE_READINESS_MS/.test(workHtml),
    'WORK_PASSAGE exposes waiting, requested destination, per-video readiness, and the real navigation function'
  );
  ok(
    /mobile section-lock/.test(workHtml) &&
      /node work-smoke-test\.mjs/.test(workHtml) &&
      /real-phone recording/.test(workHtml) &&
      /four-rest mobile passage/.test(workHtml),
    'maintained-asset comment names the mobile section-lock consumer, focused test, and real-phone recurrence'
  );

  ok(
    /var MOBILE_SECTION_GLIDE_MS = 960/.test(workHtml) &&
      /var MOBILE_READINESS_MS = 8000/.test(workHtml) &&
      /glideMs:\s*MOBILE_SECTION_GLIDE_MS/.test(workHtml) &&
      /readinessMs:\s*MOBILE_READINESS_MS/.test(workHtml),
    'hidden readiness ceiling is 8000ms and visible travel is 960ms'
  );
  ok(
    /function scrollToMobileStopIndex\(index\)[\s\S]*?mobileWaiting = true[\s\S]*?prepareMobileDestination\(bounded\)[\s\S]*?function startPassage\(\)[\s\S]*?glideScrollTo\(top\)[\s\S]*?if \(mobileDestinationReady\(stop\.id\)\)[\s\S]*?settle\("ready"\)[\s\S]*?waitForMobileDestinationReady\(stop\.id, token/.test(workHtml),
    'accepting a rest waits for decoded readiness before the visible passage may start'
  );
  ok(
    /function glideScrollTo\(top\)[\s\S]*?var duration = MOBILE_SECTION_GLIDE_MS[\s\S]*?prepareMobileDestination\(toIndex\)[\s\S]*?mobileGlideLocked = true[\s\S]*?mobileTransition = \{ fromIndex: fromIndex, toIndex: toIndex, t: 0 \}/.test(workHtml),
    'once ready, the destination stays warmed and the one authored clock starts with local pair state'
  );
  ok(
    /function glideScrollTo\(top\)[\s\S]*?if \(!motionOn \|\| Math\.abs\(distance\) < 0\.5\)[\s\S]*?return;[\s\S]*?prepareMobileDestination/.test(workHtml) &&
      /function scrollToMobileStopIndex\(index\)[\s\S]*?if \(!motionOn\)[\s\S]*?behavior:\s*"auto"/.test(workHtml),
    'Motion Off and zero-distance lands skip cinematic prepare and travel'
  );

  const videosForMatch = workHtml.match(/function videosForMobileStop\(id\) \{[\s\S]*?return \[\];\s*\}/);
  ok(!!videosForMatch, 'videosForMobileStop is extractable');
  let videosForMobileStop;
  const corridorVideo = { id: 'corridor' };
  const studioVideo = { id: 'studio' };
  const ringVideo = { id: 'ring' };
  const inkVideo = { id: 'ink' };
  const prorokPortrait = { id: 'prorok-portrait', complete: true, naturalWidth: 617, naturalHeight: 849 };
  const terminalReturn = { id: 'terminal-return', complete: true, naturalWidth: 1280, naturalHeight: 720 };
  if (videosForMatch) {
    try {
      videosForMobileStop = new Function(
        'corridorVideo',
        'studioVideo',
        'ringVideo',
        'inkVideo',
        videosForMatch[0] + '; return videosForMobileStop;'
      )(corridorVideo, studioVideo, ringVideo, inkVideo);
    } catch (e) {
      failures.push('videosForMobileStop parse: ' + e.message);
    }
  }
  ok(typeof videosForMobileStop === 'function', 'videosForMobileStop runs as a function');
  if (typeof videosForMobileStop === 'function') {
    const sameRefs = (got, expected) =>
      got.length === expected.length && got.every((video, i) => video === expected[i]);
    ok(sameRefs(videosForMobileStop('corridor'), [corridorVideo]), 'Corridor destination is the corridor loop');
    ok(sameRefs(videosForMobileStop('rana'), [ringVideo]), 'Rana destination is the single ring carrier');
    ok(sameRefs(videosForMobileStop('prorok'), [inkVideo]), 'ProRok destination is the ink loop');
    ok(sameRefs(videosForMobileStop('invitation'), []), 'Invitation destination has no video to force-play');

    const ids = workStops.map((stop) => stop[0]);
    let prewarmBothWays = true;
    for (let i = 0; i < ids.length - 1; i++) {
      const forwardDest = videosForMobileStop(ids[i + 1]);
      const reverseDest = videosForMobileStop(ids[i]);
      if (ids[i + 1] !== 'invitation' && forwardDest.length === 0) prewarmBothWays = false;
      if (reverseDest.length === 0) prewarmBothWays = false;
      const offRouteForward = forwardDest.some((video) => !['corridor', 'studio', 'ring', 'ink'].includes(video.id) ||
        (ids[i + 1] === 'rana' && video.id === 'ink') ||
        (ids[i + 1] === 'prorok' && video.id !== 'ink') ||
        (ids[i + 1] === 'corridor' && video.id !== 'corridor'));
      const offRouteReverse = reverseDest.some((video) =>
        (ids[i] === 'rana' && video.id === 'ink') ||
        (ids[i] === 'prorok' && video.id !== 'ink') ||
        (ids[i] === 'corridor' && video.id !== 'corridor'));
      if (offRouteForward || offRouteReverse) prewarmBothWays = false;
    }
    ok(prewarmBothWays, 'forward and reverse each prewarm only the destination rest world');
  }

  const requestSrc = (workHtml.match(/function requestMobileVideo\(video\) \{[\s\S]*?\n  \}/) || [''])[0];
  const prepareSrc = (workHtml.match(/function prepareMobileDestination\(index\) \{[\s\S]*?\n  \}/) || [''])[0];
  const glideSrc = (workHtml.match(/function glideScrollTo\(top\) \{[\s\S]*?\n  \}/) || [''])[0];
  const waitSrc = (workHtml.match(/function waitForMobileDestinationReady\(id, token, onDone\) \{[\s\S]*?\n  \}/) || [''])[0];
  const scrollSrc = (workHtml.match(/function scrollToMobileStopIndex\(index\) \{[\s\S]*?\n  \}/) || [''])[0];
  ok(!!requestSrc && !!prepareSrc && !!glideSrc && !!waitSrc && !!scrollSrc, 'request/prepare/wait/glide functions are extractable');
  ok(
    /video\.preload = "auto"/.test(requestSrc) &&
      /playSafe\(video\)/.test(requestSrc) &&
      /requestMobileVideo/.test(prepareSrc) &&
      /function warmMobileBeatVideos\(\)[\s\S]*?requestMobileVideo\(corridorVideo\)[\s\S]*?requestMobileVideo\(ringVideo\)[\s\S]*?requestMobileVideo\(inkVideo\)/.test(workHtml) &&
      !/function warmMobileBeatVideos\(\)[\s\S]*?requestMobileVideo\(studioVideo\)/.test(workHtml) &&
      /if \(motionOn\) \{[\s\S]*?warmMobileBeatVideos\(\)/.test(workHtml),
    'cold load warms only the three mobile source videos with preload=auto and a muted play attempt'
  );
  ok(
    /addEventListener\("loadeddata"/.test(workHtml) &&
      /addEventListener\("canplay"/.test(workHtml) &&
      /requestVideoFrameCallback/.test(workHtml) &&
      /readyState < 2/.test(workHtml) &&
      !/addEventListener\("loadedmetadata"/.test(workHtml),
    'readiness uses loadeddata/canplay, HAVE_CURRENT_DATA, and requestVideoFrameCallback — not loadedmetadata'
  );
  ok(
    /function scrollToMobileStopIndex\(index\)[\s\S]*?return new Promise/.test(workHtml) &&
      /function waitForMobileDestinationReady[\s\S]*?mobileReadinessStatus/.test(workHtml) &&
      /function applyMobileReadinessResult[\s\S]*?startPassage/.test(workHtml) &&
      !/canplaythrough/.test(requestSrc) &&
      !/canplaythrough/.test(prepareSrc) &&
      !/canplaythrough/.test(glideSrc),
    'navigation is asynchronous and gates the visible passage on decoded readiness, not canplaythrough'
  );
  ok(
    /if \(elapsed < 1\) mobileScrollRaf = window\.requestAnimationFrame\(glide\);\s*else \{\s*window\.scrollTo\(0, top\);\s*mobileScrollRaf = 0;\s*mobileTransition = null;\s*mobileGlideLocked = false;\s*clearMobileDestination\(\);\s*sampleScroll\(\);/.test(workHtml),
    'landing clears transition state, synchronizes exact rest scroll, and unlocks only after the 960ms clock'
  );
  ok(
    /function cancelMobileGlide\(\)[\s\S]*?clearMobileDestination\(\)/.test(workHtml) &&
      /function syncVideos\(p\)[\s\S]*?videoIsPreparedDestination\(corridorVideo\)[\s\S]*?videoIsPreparedDestination\(studioVideo\)[\s\S]*?videoIsPreparedDestination\(ringVideo\)[\s\S]*?videoIsPreparedDestination\(inkVideo\)/.test(workHtml),
    'prepared destination stays alive during travel; cancel and off-route sync still pause the rest'
  );
  ok(
    /get mobileDestination\(\) \{ return mobileDestinationId; \}/.test(workHtml),
    'WORK_PASSAGE exposes the in-flight destination id for consumer measurement'
  );

  {
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    const duration = Number((workHtml.match(/var MOBILE_SECTION_GLIDE_MS = ([0-9]+)/) || [])[1]);
    ok(duration === 960, 'parsed mobile glide duration is 960');

    const easeName = (glideSrc.match(/var eased\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\(elapsed\)/) || [])[1] || '';
    const easeSrc = easeName
      ? (workHtml.match(new RegExp('function ' + easeName + '\\(t\\) \\{[\\s\\S]*?\\n  \\}')) || [''])[0]
      : '';
    let authoredEase = null;
    try {
      authoredEase = new Function('clamp', easeSrc + '; return ' + easeName + ';')(clamp);
    } catch (e) {
      authoredEase = null;
    }
    ok(easeName === 'smoothstep' && typeof authoredEase === 'function', 'one clock is extractable cubic smoothstep');
    ok(
      /t \* t \* \(3 - 2 \* t\)/.test(easeSrc) &&
        !/\(t \* \(t \* 6 - 15\) \+ 10\)/.test(easeSrc),
      'the glide clock stays cubic; quintic endpoint dwell stays retired'
    );

    const from = 0.04;
    const to = 0.38;
    const uAt = (frac) => authoredEase(clamp(frac, 0, 1));
    const pAt = (ms) => from + (to - from) * uAt(ms / duration);
    ok(Math.abs(pAt(0) - from) < 1e-9, 'one clock departs from the current rest');
    ok(Math.abs(pAt(960) - to) < 1e-9, 'one clock arrives at the destination rest at 960ms');
    ok(pAt(480) < to - 0.02, 'the 480ms midpoint remains in passage, not a landing');

    let monotonic = true;
    let prev = -1;
    for (let i = 0; i <= 96; i++) {
      const u = uAt(i / 96);
      if (u + 1e-12 < prev) monotonic = false;
      prev = u;
    }
    ok(monotonic && uAt(0) === 0 && uAt(1) === 1, 'one clock is monotonic and lands exactly');

    let symmetric = true;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      if (Math.abs(uAt(t) + uAt(1 - t) - 1) > 1e-9) symmetric = false;
    }
    ok(symmetric, 'forward and reverse share the same centered clock');

    const dt = 1e-4;
    ok(Math.abs(uAt(dt) / dt) < 0.02, 'departure velocity is zero or near-zero');
    ok(Math.abs((1 - uAt(1 - dt)) / dt) < 0.02, 'landing velocity is zero or near-zero');

    ok(
      959 / duration < 1 && 960 / duration >= 1,
      'glide lock follows the 960ms clock to the rest, not visual proximity'
    );

    ok(
      /function paint\(p\)[\s\S]*?isMobile\(\) && motionOn && mobileTransition[\s\S]*?paintMobileTransition/.test(workHtml) &&
        /function paint\(p\)[\s\S]*?isMobile\(\) && motionOn[\s\S]*?paintMobileRest/.test(workHtml) &&
        /function paint\(p\)[\s\S]*?range\(p, MAP\.corridorDark/.test(workHtml),
      'Motion On mobile glide paints from the local renderer; desktop still uses global MAP'
    );
    ok(
      /mobileTransition = \{ fromIndex: fromIndex, toIndex: toIndex, t: pairT \}/.test(workHtml) &&
        /var pairT\s*=\s*mobilePairClock\(elapsed\)/.test(workHtml) &&
        /function cancelMobileGlide\(\)[\s\S]*?mobileTransition = null/.test(workHtml),
      'mobile glides carry explicit fromIndex, toIndex, and local t, and cancel clears them'
    );
    ok(
      !/easing distribution alone fixes|cubic shoulders leave the quintic endpoint dwell/.test(workHtml),
      'the old easing-distribution-as-fix premise is retired from the Work passage'
    );
  }

  {
    const mobileSheet = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/).slice(1).join('\n');
    const desktopCss = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/)[0];
    ok(
      /\.layer-rana\s*\{[\s\S]*?radial-gradient\(ellipse calc\(var\(--mask-open\) \* 118%\)/.test(desktopCss),
      'desktop Rana reveal family is unchanged'
    );
    ok(
      !/\.layer-rana\s*\{[\s\S]*?radial-gradient\(ellipse calc\(var\(--mask-open\) \* 145% \+ 8%\)/.test(mobileSheet) &&
        !/ellipse calc\(var\(--mask-open\) \* 145% \+ 8%\)/.test(mobileSheet),
      'rejected mobile expanding gem/oval silhouette is gone'
    );
    ok(
      !/linear-gradient\(to top, #000 0%, #000 calc\(var\(--mask-open\) \* 108%/.test(mobileSheet),
      'rejected mobile bottom-up linear/radial stack is gone'
    );
    ok(
      !/clip-path\s*:\s*inset\(/.test(mobileSheet) &&
        !/\.handoff-seam/.test(mobileSheet) &&
        !/\.layer\.is-carrier/.test(mobileSheet) &&
        !/\.passage-veil/.test(mobileSheet) &&
        !/--passage-veil/.test(mobileSheet) &&
        /\.layer-rana\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--rana-open\)/.test(mobileSheet) &&
        /\.layer-prorok\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--prorok-open\)/.test(mobileSheet) &&
        /\.layer-terminal\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--terminal-hold\)/.test(mobileSheet),
      'mobile handoff keeps full-bleed plates with no veil or split-screen clip'
    );
    ok(
      /<canvas class="mobile-scene-plate" id="mobile-scene-plate"><\/canvas>/.test(workHtml) &&
        /\.mobile-scene-plate\s*\{[\s\S]*?z-index\s*:\s*10[\s\S]*?background\s*:\s*var\(--void\)/.test(mobileSheet) &&
        /html\.mobile-plate-active \.world-stack > \.layer[\s\S]*?visibility\s*:\s*hidden/.test(mobileSheet),
      'mobile recipient sees one opaque canvas while legacy media layers remain hidden below it'
    );
    ok(
      /function renderMobilePlate\(index, values\)[\s\S]*?composeMobileScene\(index\)[\s\S]*?drawImage\(mobileSceneBuffer, 0, 0\)[\s\S]*?setMobilePlateActive\(true\)/.test(workHtml) &&
        /values && values\.plateScale/.test(workHtml) &&
        /values && values\.plateShift/.test(workHtml) &&
        /html\.mobile-plate-active \.world-stack\s*\{[\s\S]*?transform\s*:\s*none/.test(mobileSheet),
      'mobile camera is applied inside the atomic canvas without a second transformed compositor plane'
    );
    {
      const renderSrc = (workHtml.match(/function renderMobilePlate\(index, values\) \{[\s\S]*?\n  \}/) || [''])[0];
      const composeAt = renderSrc.indexOf('composeMobileScene(index)');
      const visibleClearAt = renderSrc.indexOf('mobilePlateCtx.fillRect');
      ok(
        /if \(!composeMobileScene\(index\)\) return false;/.test(renderSrc) &&
          composeAt >= 0 && visibleClearAt > composeAt &&
          /mobileSceneBufferCtx/.test(workHtml) &&
          /mobileMaskBufferCtx/.test(workHtml),
        'a failed source draw retains the last complete visible frame; only a completed off-DOM buffer may publish'
      );
    }
    ok(
      /\.scene-copy--rana\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-rana\)/.test(mobileSheet) &&
        /\.scene-copy--prorok\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-prorok\)/.test(mobileSheet) &&
        /\.scene-copy--terminal\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-terminal\)/.test(mobileSheet),
      'mobile copy is gated independently of world composition'
    );
    ok(
      !/\.scene-copy--rana\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        !/\.scene-copy--prorok\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        !/\.scene-copy--terminal\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        /\.scene-copy--rana\s*\{[\s\S]*?filter\s*:\s*none/.test(mobileSheet) &&
        /\.scene-copy--prorok\s*\{[\s\S]*?filter\s*:\s*none/.test(mobileSheet) &&
        /\.scene-copy--terminal\s*\{[\s\S]*?filter\s*:\s*none/.test(mobileSheet),
      'no mobile copy transition uses filter: blur(...)'
    );
    ok(
      !/\.prorok-portrait\s*\{[\s\S]*?opacity:calc\(\.62 \+ var\(--prorok-hold\)/.test(mobileSheet) &&
        /\.prorok-portrait\s*\{[\s\S]*?opacity:calc\(var\(--prorok-hold\)\)/.test(mobileSheet),
      'mobile Dylan portrait opacity follows hold with no translucent floor'
    );
    ok(
      /function mobilePairClock\(elapsed\)/.test(workHtml) &&
        /window\.scrollTo\(0, start \+ distance \* eased\)/.test(workHtml) &&
        !/mobileTransition = \{ fromIndex: fromIndex, toIndex: toIndex, t: eased \}/.test(workHtml),
      'eased scroll travel is preserved; pair t uses the local pair clock'
    );
    ok(
      /var MOBILE_CUT_PHASE = 0\.[0-9]+/.test(workHtml) &&
        /function mobileAuthoritativeIndex\(/.test(workHtml) &&
        /function mobileSceneValuesForTransition\([\s\S]*?MOBILE_CUT_PHASE/.test(workHtml) &&
        !/function mobileSceneValuesForTransition\([\s\S]*?function mix\(a, b\)/.test(workHtml) &&
        !/function mobileSceneValuesForTransition\([\s\S]*?range\(t,/.test(workHtml) &&
        !/function mobileSceneValuesForTransition\([\s\S]*?passageVeil/.test(workHtml),
      'pair renderer names a cut phase and does not mix complete rests or add a veil'
    );
    ok(
      /function paintMobileRest\(index\)[\s\S]*?renderMobilePlate\(index, values\)[\s\S]*?applySceneValues\(values\)/.test(workHtml) &&
        /function cancelVisibleMobileGlide\(\)[\s\S]*?mobileTransition = null/.test(workHtml) &&
        !/clearPassageVeil/.test(workHtml),
      'landing and cancel restore one complete canvas rest without a veil path'
    );
  }

  {
    function extractFunction(name) {
      const m = workHtml.match(new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}'));
      return m ? m[0] : '';
    }
    const mapMatch = workHtml.match(/var MAP = \{[\s\S]*?\n  \};/);
    const stillMatch = workHtml.match(/var STILL = \{[\s\S]*?\n  \};/);
    const stopsMatch = workHtml.match(/var MOBILE_STOPS = \[[\s\S]*?\];/);
    const cutDecl = (workHtml.match(/var MOBILE_CUT_PHASE = [0-9.]+;/) || [''])[0];
    const copyOutDecl = (workHtml.match(/var MOBILE_COPY_OUT_END = [0-9.]+;/) || [''])[0];
    const copyInDecl = (workHtml.match(/var MOBILE_COPY_IN_START = [0-9.]+;/) || [''])[0];
    const platePushDecl = (workHtml.match(/var MOBILE_PLATE_PUSH = [0-9.]+;/) || [''])[0];
    const plateShiftDecl = (workHtml.match(/var MOBILE_PLATE_SHIFT = [0-9.]+;/) || [''])[0];
    const parts = [
      extractFunction('clamp'),
      extractFunction('smoothstep'),
      extractFunction('range'),
      extractFunction('plateau'),
      extractFunction('span'),
      extractFunction('mobilePairClock'),
      extractFunction('copyValuesFromWorld'),
      extractFunction('withCopy'),
      mapMatch ? mapMatch[0] : '',
      stillMatch ? stillMatch[0] : '',
      stopsMatch ? stopsMatch[0] : '',
      cutDecl,
      copyOutDecl,
      copyInDecl,
      platePushDecl,
      plateShiftDecl,
      extractFunction('sceneValuesFromMap'),
      extractFunction('mobileSceneValuesForRest'),
      extractFunction('mobileCopyWeights'),
      extractFunction('mobilePlateCamera'),
      extractFunction('mobileAuthoritativeIndex'),
      extractFunction('mobileSceneValuesForTransition'),
    ];
    ok(parts.every((part) => part.length > 0), 'mobile rest/transition renderer is extractable');

    let sceneValuesFromMap;
    let mobileSceneValuesForRest;
    let mobileSceneValuesForTransition;
    let mobilePairClock;
    let mobileAuthoritativeIndex;
    let mobileCopyWeights;
    let mobilePlateCamera;
    let MOBILE_CUT_PHASE;
    let MOBILE_COPY_OUT_END;
    let MOBILE_COPY_IN_START;
    try {
      ({
        sceneValuesFromMap,
        mobileSceneValuesForRest,
        mobileSceneValuesForTransition,
        mobilePairClock,
        mobileAuthoritativeIndex,
        mobileCopyWeights,
        mobilePlateCamera,
        MOBILE_CUT_PHASE,
        MOBILE_COPY_OUT_END,
        MOBILE_COPY_IN_START,
      } = new Function(
        parts.join('\n') +
          '; return { sceneValuesFromMap, mobileSceneValuesForRest, mobileSceneValuesForTransition, mobilePairClock, mobileAuthoritativeIndex, mobileCopyWeights, mobilePlateCamera, MOBILE_CUT_PHASE, MOBILE_COPY_OUT_END, MOBILE_COPY_IN_START };'
      )());
    } catch (e) {
      failures.push('mobile transition renderer parse: ' + e.message);
    }
    ok(
      typeof sceneValuesFromMap === 'function' &&
        typeof mobileSceneValuesForRest === 'function' &&
        typeof mobileSceneValuesForTransition === 'function' &&
        typeof mobilePairClock === 'function' &&
        typeof mobileAuthoritativeIndex === 'function' &&
        typeof mobileCopyWeights === 'function' &&
        typeof mobilePlateCamera === 'function',
      'mobile transition renderer runs as functions'
    );

    const keys = [
      'corridorDark',
      'ranaOpen',
      'ranaHold',
      'ring',
      'prorokOpen',
      'prorokHold',
      'terminalHold',
      'entryCue',
      'copyRana',
      'copyProrok',
      'copyTerminal',
      'plateScale',
      'plateShift',
    ];
    const worldKeys = [
      'corridorDark',
      'ranaOpen',
      'ranaHold',
      'ring',
      'prorokOpen',
      'prorokHold',
      'terminalHold',
      'entryCue',
    ];
    const opacityKeys = ['ranaOpen', 'prorokOpen', 'terminalHold'];
    const copyKeys = ['copyRana', 'copyProrok', 'copyTerminal'];
    const COPY_EPS = 1e-4;
    const dist = (a, b) => Math.sqrt(keys.reduce((sum, key) => sum + ((a[key] || 0) - (b[key] || 0)) ** 2, 0));
    const sameValues = (a, b) => keys.every((key) => Math.abs((a[key] || 0) - (b[key] || 0)) <= 1e-9);
    const sameWorld = (a, b) => worldKeys.every((key) => Math.abs((a[key] || 0) - (b[key] || 0)) <= 1e-9);
    const hasWorld = (v) =>
      v.entryCue > 0.02 ||
      v.ranaOpen > 0.02 ||
      v.prorokOpen > 0.02 ||
      v.terminalHold > 0.02;
    const copyKeyForStop = (index) => {
      if (index === 1) return 'copyRana';
      if (index === 2) return 'copyProrok';
      if (index === 3) return 'copyTerminal';
      return null;
    };
    const copyValue = (v, index) => {
      const key = copyKeyForStop(index);
      return key ? (v[key] || 0) : 0;
    };
    const liveCopyCount = (v) => copyKeys.filter((key) => (v[key] || 0) > COPY_EPS).length;
    const topWorld = (v) => {
      if (v.terminalHold > 0.5) return 3;
      if (v.prorokOpen > 0.5) return 2;
      if (v.ranaOpen > 0.5) return 1;
      return 0;
    };
    const hasFractionalWorldOpacity = (from, to, v) =>
      opacityKeys.some((key) => {
        const lo = Math.min(from[key], to[key]);
        const hi = Math.max(from[key], to[key]);
        return hi - lo > 1e-9 && v[key] > lo + 1e-9 && v[key] < hi - 1e-9;
      });
    const cameraNeutral = (v) =>
      Math.abs((v.plateScale || 1) - 1) <= 1e-9 && Math.abs(v.plateShift || 0) <= 1e-9;
    const cameraCovered = (v) =>
      (v.plateScale || 1) + 1e-12 >= 1 &&
      Math.abs(v.plateShift || 0) <= ((v.plateScale || 1) - 1) * 50 + 0.05;
    const hasInterstitial = (v) =>
      Object.prototype.hasOwnProperty.call(v, 'passageVeil') ||
      Object.prototype.hasOwnProperty.call(v, 'veil') ||
      Object.prototype.hasOwnProperty.call(v, 'interstitial');

    const pairs = [
      [0, 1],
      [1, 2],
      [2, 3],
    ];
    ok(
      typeof MOBILE_CUT_PHASE === 'number' && MOBILE_CUT_PHASE > 0 && MOBILE_CUT_PHASE < 1,
      'an explicit cut phase is named in source and lies strictly inside (0,1)'
    );
    ok(
      typeof MOBILE_COPY_OUT_END === 'number' &&
        typeof MOBILE_COPY_IN_START === 'number' &&
        MOBILE_COPY_OUT_END < MOBILE_CUT_PHASE &&
        MOBILE_COPY_IN_START > MOBILE_CUT_PHASE,
      'copy exits before the named cut and enters after it'
    );
    if (typeof mobileSceneValuesForTransition === 'function') {
      const mapAtMidFirst = sceneValuesFromMap(0.04 + (0.38 - 0.04) * 0.5);
      const localAtMidFirst = mobileSceneValuesForTransition(0, 1, 0.5);
      ok(
        mapAtMidFirst.ring < 0.02 && localAtMidFirst.ring > 0.35,
        'during Motion On glide, visible Rana world is authored by local t, not the global MAP ring window'
      );

      let endpointsMatch = true;
      let midpointsMoved = true;
      let reverseGrammar = true;
      let worldsPresent = true;
      let noInterstitial = true;
      let singleAuthority = true;
      let binaryWorld = true;
      let noFractionalBlend = true;
      let oneCopy = true;
      let copyTiming = true;
      let cameraContract = true;
      let sourceBeforeCut = true;
      const dense = [];
      for (let i = 0; i <= 120; i++) dense.push(i / 120);
      for (const extra of [0, MOBILE_COPY_OUT_END, MOBILE_CUT_PHASE - 1e-6, MOBILE_CUT_PHASE, MOBILE_COPY_IN_START, 1]) {
        if (!dense.some((t) => Math.abs(t - extra) < 1e-12)) dense.push(extra);
      }
      dense.sort((a, b) => a - b);

      for (const [fromIndex, toIndex] of pairs) {
        const fromRest = mobileSceneValuesForRest(fromIndex);
        const toRest = mobileSceneValuesForRest(toIndex);
        if (!sameValues(mobileSceneValuesForTransition(fromIndex, toIndex, 0), fromRest)) endpointsMatch = false;
        if (!sameValues(mobileSceneValuesForTransition(fromIndex, toIndex, 1), toRest)) endpointsMatch = false;
        if (!sameValues(mobileSceneValuesForTransition(toIndex, fromIndex, 0), toRest)) endpointsMatch = false;
        if (!sameValues(mobileSceneValuesForTransition(toIndex, fromIndex, 1), fromRest)) endpointsMatch = false;
        if (!cameraNeutral(fromRest) || !cameraNeutral(toRest)) cameraContract = false;
        const early = mobileSceneValuesForTransition(fromIndex, toIndex, 0.12);
        if (topWorld(early) !== fromIndex || !sameWorld(early, fromRest)) sourceBeforeCut = false;
        for (const t of [0.25, 0.5, 0.75]) {
          const mid = mobileSceneValuesForTransition(fromIndex, toIndex, t);
          if (dist(mid, fromRest) < 0.12 || dist(mid, toRest) < 0.12) midpointsMoved = false;
          if (!hasWorld(mid)) worldsPresent = false;
        }
        for (const t of dense) {
          const forward = mobileSceneValuesForTransition(fromIndex, toIndex, t);
          const reverse = mobileSceneValuesForTransition(toIndex, fromIndex, t);
          const forwardAuth = mobileAuthoritativeIndex(fromIndex, toIndex, t);
          const reverseAuth = mobileAuthoritativeIndex(toIndex, fromIndex, t);
          const expectedForward = t < MOBILE_CUT_PHASE ? fromRest : toRest;
          const expectedReverse = t < MOBILE_CUT_PHASE ? toRest : fromRest;
          if (forwardAuth !== (t < MOBILE_CUT_PHASE ? fromIndex : toIndex)) singleAuthority = false;
          if (reverseAuth !== (t < MOBILE_CUT_PHASE ? toIndex : fromIndex)) singleAuthority = false;
          if (topWorld(forward) !== forwardAuth || topWorld(reverse) !== reverseAuth) singleAuthority = false;
          if (!sameWorld(forward, expectedForward) || !sameWorld(reverse, expectedReverse)) binaryWorld = false;
          if (hasFractionalWorldOpacity(fromRest, toRest, forward)) noFractionalBlend = false;
          if (hasFractionalWorldOpacity(toRest, fromRest, reverse)) noFractionalBlend = false;
          if (liveCopyCount(forward) > 1 || liveCopyCount(reverse) > 1) oneCopy = false;
          if (t < MOBILE_CUT_PHASE && copyValue(forward, toIndex) > COPY_EPS) copyTiming = false;
          if (t >= MOBILE_CUT_PHASE && copyValue(forward, fromIndex) > COPY_EPS) copyTiming = false;
          if (t < MOBILE_CUT_PHASE && copyValue(reverse, fromIndex) > COPY_EPS) copyTiming = false;
          if (t >= MOBILE_CUT_PHASE && copyValue(reverse, toIndex) > COPY_EPS) copyTiming = false;
          if (hasInterstitial(forward) || hasInterstitial(reverse)) noInterstitial = false;
          if (!hasWorld(forward) || !hasWorld(reverse)) worldsPresent = false;
          if (!cameraCovered(forward) || !cameraCovered(reverse)) cameraContract = false;
          if (t === 0 || t === 1) {
            if (!cameraNeutral(forward) || !cameraNeutral(reverse)) cameraContract = false;
          } else if (t >= 0.2 && t <= 0.8) {
            if ((forward.plateScale || 1) < 1.012 || Math.abs(forward.plateShift || 0) < 0.25) cameraContract = false;
            if ((reverse.plateScale || 1) < 1.012 || Math.abs(reverse.plateShift || 0) < 0.25) cameraContract = false;
          }
          if (Math.abs((forward.plateScale || 1) - (reverse.plateScale || 1)) > 1e-9) reverseGrammar = false;
          if (Math.abs((forward.plateShift || 0) + (reverse.plateShift || 0)) > 1e-9) reverseGrammar = false;
          const weights = mobileCopyWeights(t);
          if (t > 0 && t < 1 && (weights.outgoing > COPY_EPS && weights.incoming > COPY_EPS)) copyTiming = false;
        }
      }
      ok(endpointsMatch, 'local t=0 matches the source rest and t=1 matches the destination rest');
      ok(midpointsMoved, 'at t=.25, .50, and .75 every transition has a materially changed visible state');
      ok(worldsPresent, 'no forward or reverse sample leaves all authoritative world layers absent');
      ok(hasWorld(mobileSceneValuesForRest(0)), 'corridor rest still counts as a world via entry cue');
      ok(hasWorld(mobileSceneValuesForRest(1)), 'Rana rest still counts as a world');
      const zeroedRest = Object.assign({}, mobileSceneValuesForRest(1));
      worldKeys.forEach((key) => { zeroedRest[key] = 0; });
      zeroedRest.copyRana = 0;
      zeroedRest.copyProrok = 0;
      zeroedRest.copyTerminal = 0;
      ok(!hasWorld(zeroedRest), 'hasWorld fails when an authoritative world rest is zeroed');
      ok(noInterstitial, 'transition values contain no veil or interstitial channel');
      ok(binaryWorld, 'every sample world equals the source rest before the cut and the destination rest at or after it');
      ok(singleAuthority, 'before the cut the source world is authoritative; at or after it the destination is');
      ok(noFractionalBlend, 'presentation-layer world values never create a fractional whole-world opacity blend');
      ok(sourceBeforeCut, 'the outgoing world stays the authoritative plate before the cut');
      ok(oneCopy, 'no sample has more than one copy value above zero');
      ok(copyTiming, 'outgoing copy is zero by the cut and incoming copy is zero before the cut');
      ok(cameraContract, 'restrained camera motion is neutral at rests and materially non-neutral during each glide');
      ok(reverseGrammar, 'reverse transitions use the same cut, copy, and mirrored camera grammar as forward');

      ok(typeof mobilePairClock === 'function', 'pair renderer has a local wall-time clock');
      if (typeof mobilePairClock === 'function') {
        ok(
          Math.abs(mobilePairClock(0)) < 1e-12 && Math.abs(mobilePairClock(1) - 1) < 1e-12,
          'pair clock endpoints are 0 and 1'
        );
        const t250 = mobilePairClock(250 / 960);
        ok(t250 >= 250 / 960 - 1e-12, 'pair clock is not slower than linear wall time at 250ms');
        let early = true;
        let dead = false;
        for (const [fromIndex, toIndex] of pairs) {
          const origin = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock(0));
          const at250 = mobileSceneValuesForTransition(fromIndex, toIndex, t250);
          if (dist(at250, origin) < 0.12) early = false;
          for (let ms = 160; ms <= 960; ms += 20) {
            const a = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock((ms - 160) / 960));
            const b = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock(ms / 960));
            if (dist(a, b) < 0.045) dead = true;
          }
        }
        ok(early, 'every adjacent pair shows authored change by 250ms');
        ok(!dead, 'no authored dead interval lasts more than 160ms');
      }
    }
  }

  const syncMatch = workHtml.match(/function syncVideos\(p\) \{[\s\S]*?\n  \}/);
  ok(!!syncMatch, 'syncVideos is extractable for destination keep-alive');
  if (syncMatch) {
    const played = [];
    const paused = [];
    const prepared = new Set();
    try {
      const syncVideos = new Function(
        'motionOn',
        'armVideos',
        'playSafe',
        'pauseSafe',
        'videoIsPreparedDestination',
        'corridorVideo',
        'studioVideo',
        'ringVideo',
        'inkVideo',
        'function isMobile(){ return false; }\nfunction videoNeedsHiddenWarm(){ return false; }\n' + syncMatch[0] + '; return syncVideos;'
      )(
        true,
        function armVideos() {},
        function playSafe(video) { played.push(video.id); },
        function pauseSafe(video) { paused.push(video.id); },
        function videoIsPreparedDestination(video) { return prepared.has(video); },
        corridorVideo,
        studioVideo,
        ringVideo,
        inkVideo
      );
      prepared.add(studioVideo);
      prepared.add(ringVideo);
      syncVideos(0.04);
      ok(
        played.includes('studio') &&
          played.includes('ring') &&
          !played.includes('ink') &&
          paused.includes('ink') &&
          played.includes('corridor'),
        'Corridor→Rana prewarm plays Rana media immediately without starting ProRok'
      );
      played.length = 0;
      paused.length = 0;
      prepared.clear();
      prepared.add(inkVideo);
      syncVideos(0.94);
      ok(
        played.includes('ink') &&
          paused.includes('studio') &&
          paused.includes('ring') &&
          paused.includes('corridor'),
        'Invitation→ProRok reverse prewarm wakes ink before the ProRok range'
      );

      const warmSync = new Function(
        'motionOn',
        'armVideos',
        'playSafe',
        'pauseSafe',
        'videoIsPreparedDestination',
        'corridorVideo',
        'studioVideo',
        'ringVideo',
        'inkVideo',
        'function isMobile(){ return false; }\nfunction videoNeedsHiddenWarm(video){ return video && video.id === "ink"; }\n' +
          syncMatch[0] +
          '; return syncVideos;'
      )(
        true,
        function armVideos() {},
        function playSafe(video) { played.push(video.id); },
        function pauseSafe(video) { paused.push(video.id); },
        function videoIsPreparedDestination() { return false; },
        corridorVideo,
        studioVideo,
        ringVideo,
        inkVideo
      );
      played.length = 0;
      paused.length = 0;
      warmSync(0.04);
      ok(played.includes('ink'), 'cold-load warming keeps an unreadied destination video playing while hidden');
    } catch (e) {
      failures.push('syncVideos destination keep-alive: ' + e.message);
    }
  }

  ok(
    /function cancelMobileGlide\(\)[\s\S]*?cancelMobileReadiness\(\)/.test(workHtml) &&
      /function applyMotionPreference\([\s\S]*?cancelMobileGlide\(\)/.test(workHtml) &&
      /function onMobileViewportChange\(\)[\s\S]*?cancelMobileGlide\(\)/.test(workHtml) &&
      /function cancelMobileReadiness\(\)[\s\S]*?mobileRequestGeneration \+= 1/.test(workHtml),
    'Motion Off and viewport change cancel the pending readiness token'
  );
  {
    const waitFn = (workHtml.match(/function waitForMobileDestinationReady\(id, token, onDone\) \{[\s\S]*?\n  \}/) || [''])[0];
    const requestFn = (workHtml.match(/function scrollToMobileStopIndex\(index\) \{[\s\S]*?\n  \}/) || [''])[0];
    ok(
      /mobileWaiting = true/.test(requestFn) &&
        /mobileRequestedStopId = stop\.id/.test(requestFn) &&
        /prepareMobileDestination/.test(requestFn) &&
        /applyMobileReadinessResult/.test(requestFn) &&
        /function startPassage\(\)[\s\S]*?glideScrollTo\(top\)/.test(requestFn) &&
        /waitForMobileDestinationReady/.test(requestFn) &&
        /mobileReadinessStatus/.test(waitFn) &&
        !/mobileTransition = \{/.test(requestFn) &&
        !/window\.scrollTo/.test(waitFn) &&
        !/setProperty/.test(waitFn) &&
        !/paintMobileTransition/.test(requestFn),
      'hidden wait leaves the outgoing rest painted and only the live readiness path may start the handoff'
    );
  }
  ok(
    !/<[^>]+>(?:Loading|Please wait|Decoding)[^<]*</i.test(workHtml) &&
      !/class="[^"]*(?:spinner|loading-plate|faux-veil)[^"]*"/.test(workHtml),
    'no visitor-facing loading copy, spinner, or extra waiting plate'
  );

  function extractNamedFunction(name) {
    const match = workHtml.match(new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}'));
    return match ? match[0] : '';
  }

  const readinessParts = [
    'var MOBILE_FRAME_ADVANCE_S = 0.05;',
    'var hiddenFrameCanvas = null;',
    'var hiddenFrameCtx = null;',
    'var mobileReadinessPulse = null;',
    extractNamedFunction('resetVideoReadinessState'),
    extractNamedFunction('videoIsSameOrigin'),
    extractNamedFunction('getHiddenFrameProbe'),
    extractNamedFunction('probeHiddenVideoFrame'),
    extractNamedFunction('capturePlaybackBaseline'),
    extractNamedFunction('videoHasPlaybackAdvance'),
    extractNamedFunction('noteDecodedVideoFrame'),
    extractNamedFunction('proveHiddenVideoFrame'),
    extractNamedFunction('armVideoFrameCallback'),
    extractNamedFunction('videosForMobileStop'),
    extractNamedFunction('imagesForMobileStop'),
    extractNamedFunction('videoHasRenderableFrame'),
    extractNamedFunction('imageHasRenderableFrame'),
    extractNamedFunction('mobileDestinationReady'),
    extractNamedFunction('mobileDestinationFailed'),
    extractNamedFunction('mobileReadinessStatus'),
    extractNamedFunction('applyMobileReadinessResult'),
    extractNamedFunction('requestMobileVideo'),
    extractNamedFunction('warmMobileBeatVideos'),
    extractNamedFunction('bindVideoReadiness'),
  ];
  ok(readinessParts.every((part) => String(part).length > 0), 'readiness helpers are extractable');

  let videoHasRenderableFrame;
  let mobileDestinationReady;
  let mobileDestinationFailed;
  let mobileReadinessStatus;
  let applyMobileReadinessResult;
  let requestMobileVideo;
  let warmMobileBeatVideos;
  let bindVideoReadiness;
  let probeHiddenVideoFrame;
  let resetVideoReadinessState;
  const playCalls = [];
  const loadCalls = [];
  try {
    ({
      videoHasRenderableFrame,
      mobileDestinationReady,
      mobileDestinationFailed,
      mobileReadinessStatus,
      applyMobileReadinessResult,
      requestMobileVideo,
      warmMobileBeatVideos,
      bindVideoReadiness,
      probeHiddenVideoFrame,
      resetVideoReadinessState,
    } = new Function(
      'corridorVideo',
      'studioVideo',
      'ringVideo',
      'inkVideo',
      'prorokPortrait',
      'terminalReturn',
      'playSafe',
      'motionOn',
      'isMobile',
      readinessParts.join('\n') +
        '; return { videoHasRenderableFrame, mobileDestinationReady, mobileDestinationFailed, mobileReadinessStatus, applyMobileReadinessResult, requestMobileVideo, warmMobileBeatVideos, bindVideoReadiness, probeHiddenVideoFrame, resetVideoReadinessState };'
    )(
      corridorVideo,
      studioVideo,
      ringVideo,
      inkVideo,
      prorokPortrait,
      terminalReturn,
      function playSafe(video) {
        playCalls.push(video && video.id);
        if (video && typeof video.play === 'function') video.play();
      },
      true,
      function isMobile() { return true; }
    ));
  } catch (e) {
    failures.push('readiness helper parse: ' + e.message);
  }

  ok(
    typeof videoHasRenderableFrame === 'function' &&
      typeof mobileDestinationReady === 'function' &&
      typeof mobileReadinessStatus === 'function' &&
      typeof applyMobileReadinessResult === 'function' &&
      typeof requestMobileVideo === 'function' &&
      typeof warmMobileBeatVideos === 'function' &&
      typeof bindVideoReadiness === 'function' &&
      typeof probeHiddenVideoFrame === 'function',
    'readiness helpers run as functions'
  );

  if (typeof videoHasRenderableFrame === 'function') {
    const metadataOnly = { readyState: 1, error: null };
    const haveCurrent = { readyState: 2, error: null };
    const errored = { readyState: 2, error: { code: 4 } };
    const rvfcCold = {
      readyState: 2,
      error: null,
      requestVideoFrameCallback: function () {},
    };
    const rvfcData = {
      readyState: 2,
      error: null,
      jwSawDataEvent: true,
      requestVideoFrameCallback: function () {},
    };
    const rvfcFrame = {
      readyState: 2,
      error: null,
      jwDecodedFrame: true,
      requestVideoFrameCallback: function () {},
    };
    ok(!videoHasRenderableFrame(metadataOnly), 'loadedmetadata / HAVE_METADATA alone is not a decoded frame');
    ok(videoHasRenderableFrame(haveCurrent), 'HAVE_CURRENT_DATA without RVFC is a renderable frame');
    ok(!videoHasRenderableFrame(errored), 'a media error is not a renderable frame');
    ok(!videoHasRenderableFrame(rvfcCold), 'RVFC-exposed video is not ready before a presented frame');
    ok(!videoHasRenderableFrame(rvfcData), 'a data event alone does not ready an RVFC-capable video');
    rvfcData.jwDecodedFrame = true;
    ok(videoHasRenderableFrame(rvfcData), 'an RVFC-capable video is ready only after the presented-frame callback');
    ok(videoHasRenderableFrame(rvfcFrame), 'requestVideoFrameCallback can prove a decoded frame');

    function makeFakeVideo(id) {
      const listeners = {};
      const video = {
        id: id,
        readyState: 0,
        error: null,
        paused: true,
        currentTime: 0,
        src: '../assets/work/rana/' + (id === 'ring' ? 'ring-alexandrite.mp4' : 'studio-banner.mp4'),
        requestVideoFrameCallback: function (cb) {
          this._heldCallbacks = this._heldCallbacks || [];
          this._heldCallbacks.push(cb);
          this._heldCallback = cb;
          var handle = this._nextHandle || 1;
          this._nextHandle = handle + 1;
          this._handles = this._handles || {};
          this._handles[handle] = cb;
          return handle;
        },
        cancelVideoFrameCallback: function (handle) {
          this._cancelled = this._cancelled || [];
          this._cancelled.push(handle);
          if (this._handles) delete this._handles[handle];
        },
        addEventListener: function (type, fn) {
          (listeners[type] || (listeners[type] = [])).push(fn);
        },
        dispatch: function (type) {
          (listeners[type] || []).slice().forEach(function (fn) { fn.call(video); });
        },
      };
      return video;
    }

    if (typeof bindVideoReadiness === 'function') {
      const hiddenStudio = makeFakeVideo('studio');
      bindVideoReadiness(hiddenStudio);
      hiddenStudio.readyState = 2;
      hiddenStudio.dispatch('loadeddata');
      ok(!videoHasRenderableFrame(hiddenStudio), 'rVFC exists but never fires: a bare data event stays unready');
      ok(hiddenStudio.jwFrameCallbackArmed === true, 'rVFC is armed after the data signal');
      ok(hiddenStudio.jwSawDataEvent === true, 'the data event is recorded without granting readiness');
      hiddenStudio.paused = false;
      hiddenStudio.currentTime = 0.2;
      hiddenStudio.dispatch('timeupdate');
      ok(videoHasRenderableFrame(hiddenStudio), 'the same hidden video becomes ready from current-frame proof');

      hiddenStudio.dispatch('emptied');
      ok(
        hiddenStudio.jwDecodedFrame === false &&
          hiddenStudio.jwFrameCallbackArmed === false &&
          hiddenStudio.jwPlayBaseline == null,
        'emptied clears stale readiness, baseline, and armed state'
      );
      ok(
        Array.isArray(hiddenStudio._cancelled) && hiddenStudio._cancelled.length > 0,
        'reset cancels the scheduled rVFC handle when the API exists'
      );
      ok(!videoHasRenderableFrame(hiddenStudio), 'a reset video is not ready');
      hiddenStudio.readyState = 2;
      hiddenStudio.error = null;
      hiddenStudio.paused = true;
      hiddenStudio.currentTime = 0;
      hiddenStudio.dispatch('loadeddata');
      ok(!videoHasRenderableFrame(hiddenStudio), 're-armed data event alone is still not ready');
      ok(hiddenStudio.jwFrameCallbackArmed === true, 'a later data signal can arm rVFC again');
      hiddenStudio.readyState = 1;
      hiddenStudio._heldCallback();
      ok(hiddenStudio.jwFrameCallbackArmed === false, 'the callback clears armed before recording readiness');
      ok(!videoHasRenderableFrame(hiddenStudio), 'a callback with readyState < 2 does not mark ready');
      hiddenStudio.readyState = 2;
      hiddenStudio.dispatch('playing');
      ok(hiddenStudio.jwFrameCallbackArmed === true, 'playing after a rejected callback can arm again');
      hiddenStudio._heldCallback();
      ok(videoHasRenderableFrame(hiddenStudio), 'a later successful callback decodes after reset');

      const ranaRing = makeFakeVideo('ring');
      bindVideoReadiness(ranaRing);
      ranaRing.readyState = 2;
      ranaRing.dispatch('loadeddata');
      ok(
        !videoHasRenderableFrame(ranaRing),
        'Rana ring stays unready on a data event while rVFC is silent'
      );
      ranaRing.paused = false;
      ranaRing.currentTime = 0.2;
      ranaRing.dispatch('timeupdate');
      ok(
        videoHasRenderableFrame(ranaRing),
        'Rana requires one proven frame from its single mobile carrier'
      );

      const failed = makeFakeVideo('ink');
      bindVideoReadiness(failed);
      failed.readyState = 2;
      failed.dispatch('loadeddata');
      failed.jwDecodedFrame = true;
      failed.error = { code: 4 };
      failed.dispatch('error');
      ok(
        failed.jwDecodedFrame === false && failed.jwFrameCallbackArmed === false,
        'error clears stale decoded and armed state'
      );

      const generations = makeFakeVideo('studio');
      bindVideoReadiness(generations);
      generations.readyState = 2;
      generations.dispatch('loadeddata');
      const oldCallback = generations._heldCallback;
      const oldGeneration = generations.jwCallbackGeneration || 0;
      generations.dispatch('emptied');
      generations.readyState = 2;
      generations.paused = true;
      generations.currentTime = 0;
      generations.dispatch('loadeddata');
      const newCallback = generations._heldCallback;
      ok(oldCallback !== newCallback, 'reset arms a new rVFC callback');
      ok(generations.jwFrameCallbackArmed === true, 'the new generation is armed');
      oldCallback();
      ok(!videoHasRenderableFrame(generations), 'a stale rVFC callback does not certify readiness');
      ok(generations.jwFrameCallbackArmed === true, 'a stale callback does not clear the new generation arm');
      ok((generations.jwCallbackGeneration || 0) !== oldGeneration, 'reset increments the callback generation');
      generations.readyState = 2;
      newCallback();
      ok(videoHasRenderableFrame(generations), 'the current-generation callback at readyState>=2 succeeds');

      const thrown = makeFakeVideo('studio');
      thrown.requestVideoFrameCallback = function () { throw new Error('rvfc'); };
      bindVideoReadiness(thrown);
      thrown.readyState = 2;
      thrown.paused = true;
      thrown.currentTime = 0;
      thrown.dispatch('loadeddata');
      ok(!videoHasRenderableFrame(thrown), 'thrown rVFC plus no drawable/playback proof stays unready');
      ok(thrown.jwDecodedFrame !== true, 'a thrown request does not set the decoded-frame flag');
      ok(thrown.jwFrameCallbackArmed === false, 'a thrown request clears only its own armed state');
    }

    const rvfcAdvanced = {
      readyState: 2,
      error: null,
      paused: false,
      currentTime: 0.2,
      jwPlayBaseline: 0,
      jwSawDataEvent: true,
      src: '../assets/work/rana/studio-banner.mp4',
      requestVideoFrameCallback: function () {},
    };
    ok(videoHasRenderableFrame(rvfcAdvanced), 'playback advance proves a hidden current frame when rVFC never presents');
    ok(
      !probeHiddenVideoFrame(
        { readyState: 2, error: null, src: '../assets/work/rana/studio-banner.mp4' },
        { clearRect() {}, drawImage() {}, getImageData() { return { data: [0, 0, 0, 0] }; } }
      ),
      'a transparent canvas sample is not a decoded frame'
    );
    ok(
      probeHiddenVideoFrame(
        { readyState: 2, error: null, src: '../assets/work/rana/studio-banner.mp4' },
        { clearRect() {}, drawImage() {}, getImageData() { return { data: [12, 40, 18, 255] }; } }
      ),
      'a readable opaque canvas pixel proves a hidden current frame'
    );
    ok(
      !probeHiddenVideoFrame(
        { readyState: 2, error: null, src: '../assets/work/rana/studio-banner.mp4' },
        { clearRect() {}, drawImage() { throw new Error('tainted'); }, getImageData() { return { data: [1, 1, 1, 255] }; } }
      ),
      'a throwing canvas probe is not treated as ready'
    );

    studioVideo.readyState = 2;
    studioVideo.error = null;
    ringVideo.readyState = 0;
    ringVideo.error = null;
    inkVideo.readyState = 2;
    inkVideo.error = null;
    corridorVideo.readyState = 0;
    corridorVideo.error = null;
    ok(!mobileDestinationReady('rana'), 'Rana is not ready before the single ring carrier has a decoded frame');
    ok(mobileDestinationReady('prorok'), 'ProRok is ready from its ink loop plus loaded portrait');
    ok(!mobileDestinationReady('corridor'), 'reverse corridor is not ready until its loop has a frame');
    ok(mobileDestinationReady('invitation'), 'Invitation is ready only when its terminal image is loaded');
    terminalReturn.complete = false;
    ok(!mobileDestinationReady('invitation'), 'Invitation cannot cut to an undecoded terminal image');
    terminalReturn.complete = true;
    prorokPortrait.complete = false;
    ok(!mobileDestinationReady('prorok'), 'ProRok cannot cut to an undecoded portrait image');
    prorokPortrait.complete = true;
    ringVideo.readyState = 2;
    ok(mobileDestinationReady('rana'), 'Rana becomes ready from the decoded ring carrier');
    studioVideo.requestVideoFrameCallback = function () {};
    ringVideo.requestVideoFrameCallback = function () {};
    studioVideo.jwSawDataEvent = true;
    ringVideo.jwSawDataEvent = true;
    delete studioVideo.jwDecodedFrame;
    delete ringVideo.jwDecodedFrame;
    ok(!mobileDestinationReady('rana'), 'Rana stays pending on an RVFC ring after data events only');
    ringVideo.jwDecodedFrame = true;
    ok(mobileDestinationReady('rana'), 'Rana is ready after the ring presented-frame callback');
    delete studioVideo.requestVideoFrameCallback;
    delete ringVideo.requestVideoFrameCallback;
    delete studioVideo.jwSawDataEvent;
    delete ringVideo.jwSawDataEvent;
    delete studioVideo.jwDecodedFrame;
    delete ringVideo.jwDecodedFrame;
    corridorVideo.readyState = 2;
    ok(mobileDestinationReady('corridor'), 'reverse corridor uses the same decoded-frame rule');
    ringVideo.error = { code: 4 };
    ok(mobileDestinationFailed('rana') && !mobileDestinationReady('rana'), 'a Rana media error fails the destination');
    ringVideo.error = null;

    const coldStudio = { id: 'studio', readyState: 0, preload: 'metadata', loadCalls: 0, play() { this.played = true; } };
    coldStudio.load = function load() { this.loadCalls += 1; };
    requestMobileVideo(coldStudio);
    ok(
      coldStudio.preload === 'auto' && coldStudio.loadCalls === 1 && coldStudio.played === true,
      'requestMobileVideo upgrades preload, loads a cold element, and attempts muted play'
    );

    playCalls.length = 0;
    corridorVideo.readyState = 0;
    studioVideo.readyState = 0;
    ringVideo.readyState = 0;
    inkVideo.readyState = 0;
    corridorVideo.load = function load() { loadCalls.push('corridor'); };
    studioVideo.load = function load() { loadCalls.push('studio'); };
    ringVideo.load = function load() { loadCalls.push('ring'); };
    inkVideo.load = function load() { loadCalls.push('ink'); };
    corridorVideo.play = function play() {};
    studioVideo.play = function play() {};
    ringVideo.play = function play() {};
    inkVideo.play = function play() {};
    warmMobileBeatVideos();
    ok(
      ['corridor', 'ring', 'ink'].every((id) => playCalls.includes(id) && loadCalls.includes(id)) &&
        !playCalls.includes('studio') && !loadCalls.includes('studio'),
      'cold-load warming requests only the three mobile source videos'
    );

    const restSnapshot = {
      scroll: 12,
      copyRana: 0,
      copyProrok: 0,
      corridorDark: 0,
      ranaOpen: 0,
      rest: 'corridor',
    };
    const waitingScene = { ...restSnapshot };
    function startPassage() {
      waitingScene.scroll = 380;
      waitingScene.copyRana = 1;
      waitingScene.ranaOpen = 1;
      waitingScene.corridorDark = 1;
      waitingScene.rest = 'rana';
    }
    function abortRequest() {
      waitingScene.unlocked = true;
    }

    ok(mobileReadinessStatus({
      token: 1,
      generation: 1,
      failed: false,
      ready: true,
      elapsedMs: 0,
      ceilingMs: 8000,
    }) === 'ready', 'already-decoded media is ready with no mandatory delay');
    ok(applyMobileReadinessResult('ready', 1, 1, startPassage, abortRequest) === 'started', 'ready-before-transition starts the existing passage');
    ok(waitingScene.rest === 'rana', 'the visible clock starts only after readiness resolves');

    Object.assign(waitingScene, restSnapshot);
    delete waitingScene.unlocked;
    ok(mobileReadinessStatus({
      token: 1,
      generation: 1,
      failed: false,
      ready: false,
      elapsedMs: 7999,
      ceilingMs: 8000,
    }) === 'pending', 'an unreadied destination stays pending before the 8000ms ceiling');
    ok(
      waitingScene.scroll === restSnapshot.scroll &&
        waitingScene.copyRana === restSnapshot.copyRana &&
        waitingScene.copyProrok === restSnapshot.copyProrok &&
        waitingScene.corridorDark === restSnapshot.corridorDark &&
        waitingScene.ranaOpen === restSnapshot.ranaOpen &&
        waitingScene.rest === restSnapshot.rest,
      'waiting leaves the complete outgoing rest unchanged'
    );

    const timeoutStatus = mobileReadinessStatus({
      token: 1,
      generation: 1,
      failed: false,
      ready: false,
      elapsedMs: 8000,
      ceilingMs: 8000,
    });
    ok(timeoutStatus === 'timeout', '8000ms without a decoded frame times out');
    ok(applyMobileReadinessResult(timeoutStatus, 1, 1, startPassage, abortRequest) === 'timeout', 'timeout cancels instead of starting the passage');
    ok(waitingScene.rest === 'corridor' && waitingScene.unlocked === true, 'timeout leaves the outgoing rest intact and unlocks navigation');

    delete waitingScene.unlocked;
    const errorStatus = mobileReadinessStatus({
      token: 1,
      generation: 1,
      failed: true,
      ready: false,
      elapsedMs: 40,
      ceilingMs: 8000,
    });
    ok(errorStatus === 'error', 'a media error is a failed readiness result');
    ok(applyMobileReadinessResult(errorStatus, 1, 1, startPassage, abortRequest) === 'error', 'error cancels the requested move');
    ok(waitingScene.rest === 'corridor', 'error does not advance to a poster or partial destination');

    let staleStarted = false;
    let staleAborted = false;
    ok(mobileReadinessStatus({
      token: 1,
      generation: 2,
      failed: false,
      ready: true,
      elapsedMs: 10,
      ceilingMs: 8000,
    }) === 'stale', 'a newer generation makes the old readiness token stale');
    ok(
      applyMobileReadinessResult('ready', 1, 2, function () { staleStarted = true; }, function () { staleAborted = true; }) === 'stale' &&
        staleStarted === false &&
        staleAborted === false,
      'a stale token cannot start a late transition or abort a newer request'
    );

    ok(
      Number((workHtml.match(/var MOBILE_READINESS_MS = ([0-9]+)/) || [])[1]) === 8000 &&
        Number((workHtml.match(/var MOBILE_SECTION_GLIDE_MS = ([0-9]+)/) || [])[1]) === 960,
      'exact clocks stay 8000ms hidden readiness and 960ms visible passage'
    );
  }
}

/*
 * Mobile functional labels stay at the 16 CSS pixel / 1rem floor.
 * Limited to visitor-facing controls inside the 720px sheet.
 */
{
  const mobileSheet = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/).slice(1).join('\n');
  const ruleBody = (selector) => {
    const match = mobileSheet.match(new RegExp(selector + '\\s*\\{([^}]*)\\}'));
    return match ? match[1] : '';
  };
  const isOneRem = (body) => /font-size\s*:\s*1rem(?![.\d])/.test(body);
  const wordmark = ruleBody('\\.wordmark');
  const nav = ruleBody('\\.nav-link\\s*,\\s*\\.motion-toggle');
  const sceneLink = ruleBody('\\.scene-link');
  const sceneAction = ruleBody('\\.scene-action');
  ok(isOneRem(wordmark), 'mobile .wordmark stays at 1rem');
  ok(isOneRem(nav), 'mobile .nav-link, .motion-toggle stay at 1rem');
  ok(isOneRem(sceneLink), 'mobile .scene-link stays at 1rem');
  ok(isOneRem(sceneAction), 'mobile .scene-action stays at 1rem');
}

// node --check on this test file and smoke-test remain runnable
const selfCheck = spawnSync(process.execPath, ['--check', path.join(ROOT, 'work-smoke-test.mjs')], { encoding: 'utf8' });
ok(selfCheck.status === 0, 'work-smoke-test.mjs syntax');

if (failures.length) {
  console.error('\nFAIL ' + failures.length);
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('\nAll work passage checks passed.');
