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
ok(/autoplay\s+muted\s+loop\s+playsinline\s+preload="metadata"/.test(workHtml), 'ambient video attributes');
ok(
  /id="corridor-motion-video"[\s\S]*?autoplay\s+muted\s+loop\s+playsinline\s+preload="auto"/.test(workHtml),
  'corridor motion autoplays inline with eager local preload'
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
  /class="terminal-return"\s+src="\.\.\/assets\/golden-arrival\/frames\/ga-360\.webp"/.test(workHtml),
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
  /id="passage-veil"/.test(workHtml) &&
    /--passage-veil/.test(workHtml) &&
    /\.passage-veil\s*\{[\s\S]*?linear-gradient\(168deg, #0a1a20/.test(workHtml) &&
    /\.passage-veil\s*\{[\s\S]*?rgba\(94,231,240/.test(workHtml) &&
    /\.passage-veil\s*\{[\s\S]*?rgba\(217,122,58/.test(workHtml),
  'mobile handoff uses a full-frame authored cyan/copper veil plate'
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
    /html\[data-motion="off"\] \.passage-veil\s*\{[\s\S]*?display\s*:\s*none/.test(workHtml) &&
      /html\[data-motion="off"\] \.passage-veil\s*\{[\s\S]*?opacity\s*:\s*0/.test(workHtml),
    'Motion Off does not depend on the animated passage veil'
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
 * Behavioral check: four STILL rests; one-gesture / 2400ms / lock;
 * scroll travel stays cubic smoothstep; pair renderer uses a local clock
 * with visible change by 250ms and no dead run over 350ms; Motion On
 * glide carries fromIndex/toIndex/local pair t and paints from the mobile
 * pair renderer rather than narrow global MAP bands; t=0/1 match rests; mid
 * samples are off both endpoints; no blank world; Rana/Dylan and Dylan/terminal
 * copy do not overlap; reverse uses the same full-frame veil grammar;
 * landing clears transition state after 2400ms; destination prewarm; Motion
 * Off immediate; TAU = 0.41. Rejected silhouettes (expanding gem, bottom-up
 * stack, vertical tear, clip-path inset split) stay gone. One veil covers
 * the viewport before world identity changes; copy enters only after the
 * incoming world owns the frame.
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
      /function advanceMobileStop\(direction\)[\s\S]*?if \(!isMobile\(\) \|\| mobileGlideLocked/.test(workHtml) &&
      /function onMobileTouchStart\(e\)[\s\S]*?mobileGlideLocked/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?if \(!mobileGlideLocked\) advanceMobileStop/.test(workHtml),
    'one authored glide lock blocks further stop-skipping fragments'
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
    /window\.WORK_PASSAGE = \{[\s\S]*?mobileStopIndex[\s\S]*?mobileGliding[\s\S]*?goMobileStop:\s*scrollToMobileStopIndex/.test(workHtml) &&
      /get mobileTransition\(\) \{[\s\S]*?fromIndex[\s\S]*?toIndex[\s\S]*?t:/.test(workHtml),
    'WORK_PASSAGE exposes read-only stop/glide/transition state and the real navigation function'
  );
  ok(
    /mobile section-lock/.test(workHtml) &&
      /node work-smoke-test\.mjs/.test(workHtml) &&
      /real-phone recording/.test(workHtml) &&
      /four-rest mobile passage/.test(workHtml),
    'maintained-asset comment names the mobile section-lock consumer, focused test, and real-phone recurrence'
  );

  ok(
    /var MOBILE_SECTION_GLIDE_MS = 2400/.test(workHtml) &&
      /glideMs:\s*MOBILE_SECTION_GLIDE_MS/.test(workHtml) &&
      !/var MOBILE_SECTION_GLIDE_MS = 1200/.test(workHtml),
    'mobile cinematic travel is authored at 2400ms, not the 1200ms jump'
  );
  ok(
    /function glideScrollTo\(top\)[\s\S]*?var duration = MOBILE_SECTION_GLIDE_MS[\s\S]*?prepareMobileDestination\(toIndex\)[\s\S]*?mobileGlideLocked = true[\s\S]*?mobileTransition = \{ fromIndex: fromIndex, toIndex: toIndex, t: 0 \}/.test(workHtml),
    'accepting a rest prepares that destination, then locks the one authored clock with local pair state'
  );
  ok(
    /function glideScrollTo\(top\)[\s\S]*?if \(!motionOn \|\| Math\.abs\(distance\) < 0\.5\)[\s\S]*?return;[\s\S]*?prepareMobileDestination/.test(workHtml),
    'Motion Off and zero-distance lands skip cinematic prepare and travel'
  );

  const videosForMatch = workHtml.match(/function videosForMobileStop\(id\) \{[\s\S]*?return \[\];\s*\}/);
  ok(!!videosForMatch, 'videosForMobileStop is extractable');
  let videosForMobileStop;
  const corridorVideo = { id: 'corridor' };
  const studioVideo = { id: 'studio' };
  const ringVideo = { id: 'ring' };
  const inkVideo = { id: 'ink' };
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
    ok(sameRefs(videosForMobileStop('rana'), [studioVideo, ringVideo]), 'Rana destination is studio + ring');
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
  ok(!!requestSrc && !!prepareSrc && !!glideSrc, 'request/prepare/glide functions are extractable');
  ok(
    /video\.preload = "auto"/.test(requestSrc) &&
      /playSafe\(video\)/.test(requestSrc) &&
      /requestMobileVideo/.test(prepareSrc) &&
      !/canplaythrough|await |readyState\s*>=\s*[34]/.test(requestSrc) &&
      !/canplaythrough|await |readyState\s*>=\s*[34]/.test(prepareSrc) &&
      !/canplaythrough|await /.test(glideSrc),
    'destination load/play is eager and never gates the glide on readiness'
  );
  ok(
    /if \(elapsed < 1\) mobileScrollRaf = window\.requestAnimationFrame\(glide\);\s*else \{\s*window\.scrollTo\(0, top\);\s*mobileScrollRaf = 0;\s*mobileTransition = null;\s*mobileGlideLocked = false;\s*clearMobileDestination\(\);\s*sampleScroll\(\);/.test(workHtml),
    'landing clears transition state, synchronizes exact rest scroll, and unlocks only after the 2400ms clock'
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
    ok(duration === 2400, 'parsed mobile glide duration is 2400');

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
    ok(Math.abs(pAt(2400) - to) < 1e-9, 'one clock arrives at the destination rest at 2400ms');
    ok(pAt(1200) < to - 0.02, 'the old 1200ms mark is still mid-passage, not a landing');

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
      2399 / duration < 1 && 2400 / duration >= 1,
      'glide lock follows the 2400ms clock to the rest, not visual proximity'
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
        /\.passage-veil\s*\{[\s\S]*?opacity\s*:\s*var\(--passage-veil\)/.test(mobileSheet) &&
        /\.passage-veil\s*\{[\s\S]*?#040A0C/.test(mobileSheet),
      'mobile handoff is a full-frame opaque veil, not a split-screen clip'
    );
    ok(
      /\.scene-copy--rana\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-rana\)/.test(mobileSheet) &&
        /\.scene-copy--prorok\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-prorok\)/.test(mobileSheet) &&
        /\.scene-copy--terminal\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-terminal\)/.test(mobileSheet),
      'mobile copy is gated independently of world composition'
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
      /function span\(t, a, b\)/.test(workHtml) &&
        !/function mobileSceneValuesForTransition\([\s\S]*?range\(t,/.test(workHtml),
      'pair renderer uses a linear local span and does not re-smoothstep through range()'
    );
    ok(
      /function paintMobileRest\(index\) \{\s*clearPassageVeil\(\);/.test(workHtml) &&
        /function cancelMobileGlide\(\)[\s\S]*?clearPassageVeil\(\)/.test(workHtml),
      'landing and cancel clear the passage veil'
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
    const parts = [
      extractFunction('clamp'),
      extractFunction('smoothstep'),
      extractFunction('range'),
      extractFunction('plateau'),
      extractFunction('span'),
      extractFunction('mobilePairClock'),
      extractFunction('copyValuesFromWorld'),
      extractFunction('withCopyAndVeil'),
      mapMatch ? mapMatch[0] : '',
      stillMatch ? stillMatch[0] : '',
      stopsMatch ? stopsMatch[0] : '',
      extractFunction('sceneValuesFromMap'),
      extractFunction('mobileSceneValuesForRest'),
      extractFunction('mobileSceneValuesForTransition'),
    ];
    ok(parts.every((part) => part.length > 0), 'mobile rest/transition renderer is extractable');

    let sceneValuesFromMap;
    let mobileSceneValuesForRest;
    let mobileSceneValuesForTransition;
    let mobilePairClock;
    try {
      ({ sceneValuesFromMap, mobileSceneValuesForRest, mobileSceneValuesForTransition, mobilePairClock } = new Function(
        parts.join('\n') +
          '; return { sceneValuesFromMap, mobileSceneValuesForRest, mobileSceneValuesForTransition, mobilePairClock };'
      )());
    } catch (e) {
      failures.push('mobile transition renderer parse: ' + e.message);
    }
    ok(
      typeof sceneValuesFromMap === 'function' &&
        typeof mobileSceneValuesForRest === 'function' &&
        typeof mobileSceneValuesForTransition === 'function' &&
        typeof mobilePairClock === 'function',
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
      'passageVeil',
    ];
    const worldKeys = ['corridorDark', 'ranaOpen', 'ranaHold', 'ring', 'prorokOpen', 'prorokHold', 'terminalHold'];
    const dist = (a, b) => Math.sqrt(keys.reduce((sum, key) => sum + (a[key] - b[key]) ** 2, 0));
    const sameValues = (a, b) => keys.every((key) => Math.abs(a[key] - b[key]) <= 1e-9);
    const sameWorld = (a, b) => worldKeys.every((key) => Math.abs(a[key] - b[key]) <= 1e-9);
    const hasWorld = (v) =>
      (v.ranaOpen < 0.97 && v.prorokOpen < 0.97 && v.terminalHold < 0.97) ||
      v.ranaOpen > 0.02 ||
      v.prorokOpen > 0.02 ||
      v.terminalHold > 0.02;
    const incomingCopy = (fromIndex, toIndex, v) => {
      if (toIndex === 1 || fromIndex === 1 && toIndex === 0) return v.copyRana;
      if (toIndex === 2 || fromIndex === 2 && toIndex === 1) return v.copyProrok;
      return v.copyTerminal;
    };
    const outgoingCopy = (fromIndex, toIndex, v) => {
      if (fromIndex === 1 || toIndex === 1 && fromIndex === 0) return v.copyRana;
      if (fromIndex === 2 || toIndex === 2 && fromIndex === 1) return v.copyProrok;
      return v.copyTerminal;
    };

    const pairs = [
      [0, 1],
      [1, 2],
      [2, 3],
    ];
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
      let copySeparated = true;
      let veilCoversFirst = true;
      let veilStartsEarly = true;
      let singleWorld = true;
      let copyAfterAuthority = true;
      for (const [fromIndex, toIndex] of pairs) {
        const fromRest = mobileSceneValuesForRest(fromIndex);
        const toRest = mobileSceneValuesForRest(toIndex);
        if (!sameValues(mobileSceneValuesForTransition(fromIndex, toIndex, 0), fromRest)) endpointsMatch = false;
        if (!sameValues(mobileSceneValuesForTransition(fromIndex, toIndex, 1), toRest)) endpointsMatch = false;
        const early = mobileSceneValuesForTransition(fromIndex, toIndex, 0.12);
        if (!(early.passageVeil > 0.15) || !sameWorld(early, fromRest)) veilStartsEarly = false;
        for (const t of [0.25, 0.5, 0.75]) {
          const mid = mobileSceneValuesForTransition(fromIndex, toIndex, t);
          if (dist(mid, fromRest) < 0.12 || dist(mid, toRest) < 0.12) midpointsMoved = false;
          if (!hasWorld(mid)) worldsPresent = false;
        }
        let sawDest = false;
        for (let i = 0; i <= 80; i++) {
          const t = i / 80;
          const forward = mobileSceneValuesForTransition(fromIndex, toIndex, t);
          const reverse = mobileSceneValuesForTransition(toIndex, fromIndex, t);
          if (Math.abs(forward.passageVeil - reverse.passageVeil) > 1e-9) reverseGrammar = false;
          if (!hasWorld(forward) || !hasWorld(reverse)) worldsPresent = false;
          if (!sameWorld(forward, fromRest) && !sameWorld(forward, toRest)) singleWorld = false;
          if (!sameWorld(reverse, mobileSceneValuesForRest(toIndex)) && !sameWorld(reverse, mobileSceneValuesForRest(fromIndex))) {
            singleWorld = false;
          }
          const copies = [forward.copyRana, forward.copyProrok, forward.copyTerminal].filter((value) => value > 0.06);
          if (copies.length > 1) copySeparated = false;
          const reverseCopies = [reverse.copyRana, reverse.copyProrok, reverse.copyTerminal].filter((value) => value > 0.06);
          if (reverseCopies.length > 1) copySeparated = false;
          if (!sameWorld(forward, fromRest)) {
            if (!sawDest && forward.passageVeil < 0.97) veilCoversFirst = false;
            sawDest = true;
          }
          if (fromIndex > 0 && outgoingCopy(fromIndex, toIndex, forward) > 0.06 && forward.passageVeil >= 0.97) {
            copyAfterAuthority = false;
          }
          if (incomingCopy(fromIndex, toIndex, forward) > 0.06 && (forward.passageVeil > 0.2 || !sameWorld(forward, toRest))) {
            copyAfterAuthority = false;
          }
        }
        if (!sawDest) veilCoversFirst = false;
      }
      ok(endpointsMatch, 'local t=0 matches the source rest and t=1 matches the destination rest');
      ok(midpointsMoved, 'at t=.25, .50, and .75 every transition has a materially changed visible state');
      ok(worldsPresent, 'no forward or reverse sample leaves all authoritative world layers absent');
      ok(copySeparated, 'Rana/Dylan and Dylan/terminal copy never overlap above the 0.06 legibility threshold');
      ok(veilStartsEarly, 'the full-frame veil is already visible in the first quarter while the outgoing world still owns the plate');
      ok(veilCoversFirst, 'world identity changes only after the veil fully covers the viewport');
      ok(singleWorld, 'every sample is exactly the outgoing rest or the incoming rest — never a mixed-world blend');
      ok(copyAfterAuthority, 'outgoing copy retires before full occlusion; incoming copy enters only after the incoming world owns a lifted veil');
      ok(reverseGrammar, 'reverse uses the same full-frame veil envelope as forward');

      ok(typeof mobilePairClock === 'function', 'pair renderer has a local wall-time clock');
      if (typeof mobilePairClock === 'function') {
        ok(
          Math.abs(mobilePairClock(0)) < 1e-12 && Math.abs(mobilePairClock(1) - 1) < 1e-12,
          'pair clock endpoints are 0 and 1'
        );
        const t250 = mobilePairClock(250 / 2400);
        ok(t250 >= 250 / 2400 - 1e-12, 'pair clock is not slower than linear wall time at 250ms');
        let early = true;
        let dead = false;
        for (const [fromIndex, toIndex] of pairs) {
          const origin = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock(0));
          const at250 = mobileSceneValuesForTransition(fromIndex, toIndex, t250);
          if (dist(at250, origin) < 0.12) early = false;
          for (let ms = 350; ms <= 2400; ms += 25) {
            const a = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock((ms - 350) / 2400));
            const b = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock(ms / 2400));
            if (dist(a, b) < 0.045) dead = true;
          }
        }
        ok(early, 'every adjacent pair shows authored change by 250ms');
        ok(!dead, 'no authored dead interval lasts more than 350ms');
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
        syncMatch[0] + '; return syncVideos;'
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
    } catch (e) {
      failures.push('syncVideos destination keep-alive: ' + e.message);
    }
  }
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
