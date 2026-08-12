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
  workHtml.includes('clip-path') ||
    workHtml.includes('-webkit-clip-path') ||
    workHtml.includes('mask-image') ||
    workHtml.includes('-webkit-mask-image'),
  'spatial clip/mask reveal'
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
// Terminal mask uses connected additive floors (not detached horizontal-only lobes)
ok(
  /Vertical threshold tear from center/.test(workHtml) ||
    /layer-terminal[\s\S]*?mask-open\) \* 28% \+ 4%/.test(workHtml),
  'terminal mask rebuilt as connected vertical tear'
);

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

// node --check on this test file and smoke-test remain runnable
const selfCheck = spawnSync(process.execPath, ['--check', path.join(ROOT, 'work-smoke-test.mjs')], { encoding: 'utf8' });
ok(selfCheck.status === 0, 'work-smoke-test.mjs syntax');

if (failures.length) {
  console.error('\nFAIL ' + failures.length);
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('\nAll work passage checks passed.');
