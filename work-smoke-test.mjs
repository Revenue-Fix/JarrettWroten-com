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
ok(/data-role="work-label"[^>]*href="work\/"/.test(rootHtml) || /href="work\/"[^>]*data-role="work-label"/.test(rootHtml), 'scripted portfolio header Work link');
ok(rootHtml.includes('class="portfolio-nav-link portfolio-is-current"') && rootHtml.includes('href="work/"'), 'homepage Work link class + href present');
ok(/no-js-route[\s\S]*href="work\/"/.test(rootHtml), 'no-JS path includes Work route');
ok(rootHtml.includes('data-process-work-exit') && rootHtml.includes('process-work-exit-veil'), 'authored process-to-Work exit transition');
ok(rootHtml.includes('jw-work-enter'), 'exit hands enter flag to Work route');
ok(/min-height:\s*44px/.test(rootHtml) && rootHtml.includes('.process-work-link'), 'Work link 44px target styling');
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
  'Generations Kitchen',
  'The concept lets the food lead before the menu.',
  'Pā‘ina Café',
  'Pā‘ina means gathering. The kitchen in motion—mochi, poke, and the handoff—becomes the invitation.',
  'Explore the restaurant concept',
  'Rana Levy',
  'Rana cuts each stone by hand. So I built the concept around the hand, the cut, and the way a gem changes in the light.',
  'Ready Now',
  'Made To Order',
  'Custom Consultation',
  'Explore the concept',
  'Dylan Prorok',
  'A large tattoo has to work with the body and still read from across the room. I built the concept around scale, body flow, and the choice to start a long project.',
  'Tattoo Artist - In Progress.',
  'Visit the concept',
  'See the process.',
  'Continue into the leak, the rebuild, and one result from the process.',
  'Continue to the process',
  'Get a free concept for your site.',
  'Book at least 24 hours ahead. Add your current website to the form, and I’ll build your concept before our call.',
  'Book your call',
  'Back to Jarrett',
];
for (const phrase of requiredPhrases) {
  ok(workHtml.includes(phrase), 'work copy: ' + phrase);
}
ok((workHtml.match(/href="\.\.\/book\/"/g) || []).length === 2, 'Work routes scripted and no-JS booking actions through the local booking page');
ok(/class="terminal-book"[\s\S]*?class="scene-action terminal-book-action"/.test(workHtml), 'scripted Work keeps booking inside the existing terminal rest');
ok(!workHtml.includes('Explore the final draft'), 'superseded restaurant action wording is absent');
ok((workHtml.match(/Restaurant Concept/g) || []).length >= 4, 'restaurant status is visible in scripted and no-JS Work consumers');
{
  const noJsRana = (workHtml.match(/<h2>Rana Levy<\/h2>[\s\S]*?<h2>Dylan Prorok<\/h2>/) || [''])[0];
  const scriptedRana = (workHtml.match(/id="copy-rana"[\s\S]*?id="copy-prorok"/) || [''])[0];
  ok(noJsRana.includes('Pending Engagement') && scriptedRana.includes('Pending Engagement'), 'Rana pending status is visible in scripted and no-JS Work consumers');
}
ok(!/live Rana site|I built the site around the hand/.test(workHtml), 'Rana copy stays inside the concept and pending-engagement boundary');
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
const DYLAN_TRUTH = 'Tattoo Artist - In Progress.';
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
ok(!/currently being revised (?:with|by) Dylan Prorok/.test(workHtml), 'Dylan copy makes no unsupported collaboration claim');

// Links — four project destinations + process continuation
ok(workHtml.includes('https://generations.jarrettwroten.com/'), 'Generations final-draft URL');
ok(workHtml.includes('https://paina.jarrettwroten.com/'), 'Pā‘ina final-draft URL');
ok(workHtml.includes('https://rana.jarrettwroten.com/'), 'Rana live site URL');
ok(workHtml.includes('https://prorok.jarrettwroten.com/'), 'ProRok concept URL');
ok(/href="\.\.\/"/.test(workHtml) && workHtml.includes('Back to Jarrett'), 'route back home');
ok(!/href=["']#["']/.test(workHtml), 'no dead hash-only links');
ok(!/<form\b/i.test(workHtml), 'no form inserted into the work passage');

// No-JS truth path preserves the five-stop visitor order.
const noJsMatch = workHtml.match(/id="no-js-route"[\s\S]*?<\/main>/i);
ok(!!noJsMatch, 'no-JS route block present');
if (noJsMatch) {
  const noJs = noJsMatch[0];
  const markers = [
    'Jarrett Wroten',
    'Generations Kitchen',
    'https://generations.jarrettwroten.com/',
    'Pā‘ina Café',
    'https://paina.jarrettwroten.com/',
    'Rana Levy',
    'Ready Now',
    'https://rana.jarrettwroten.com/',
    'Dylan Prorok',
    'https://prorok.jarrettwroten.com/',
    'Tattoo Artist - In Progress.',
    '../assets/golden-arrival/frames/ga-360.webp',
    'See the process.',
    'Continue to the process',
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
  if (orderOk) ok(true, 'no-JS readable five-stop order + project/process actions');
}

// Media wiring — local only, real posters, ambient video attrs
ok(workHtml.includes('../assets/work/generations/loco-moco-natural-desktop-dc59bdf1.mp4'), 'Generations desktop direct-master Loco Moco motion path');
ok(workHtml.includes('../assets/work/generations/loco-moco-natural-mobile-fc141d42.mp4'), 'Generations mobile direct-master full-bleed Loco Moco motion path');
ok(workHtml.includes('../assets/work/paina/opening-desktop.mp4'), 'Pā‘ina desktop motion path');
ok(workHtml.includes('../assets/work/paina/opening-mobile-from-2p4.mp4'), 'Pā‘ina mobile motion path begins at the authored match frame');
ok(workHtml.includes('../assets/work/paina/opening-mobile-entry-2p4.jpg'), 'Pā‘ina mobile match-cut frame');
ok(workHtml.includes('../assets/work/rana/all-rings-desktop-45b16c5d.mp4'), 'Rana desktop ring-only master path');
ok(workHtml.includes('../assets/work/rana/all-rings-mobile-937040ac.mp4'), 'Rana portrait ring-only master path');
ok(workHtml.includes('../assets/work/rana/alexandrite-desktop-cedccbe9.mp4'), 'Rana desktop Alexandrite follow-up path');
ok(workHtml.includes('../assets/work/rana/alexandrite-mobile-d0e351ff.mp4'), 'Rana portrait Alexandrite follow-up path');
ok(workHtml.includes('../demos/dylan-prorok/healed-montage-desktop-854d3384.mp4'), 'Dylan desktop Healed montage path');
ok(workHtml.includes('../demos/dylan-prorok/healed-montage-mobile-18bdbd22.mp4'), 'Dylan portrait Healed montage path');
ok(
  /<video\b[^>]*\bid="generations-video"[^>]*\bloop\b[^>]*\bmuted\b[^>]*\bplaysinline\b[^>]*\bpreload="none"[^>]*>/.test(workHtml) &&
    /<video\b[^>]*\bid="paina-video"[^>]*\bloop\b[^>]*\bmuted\b[^>]*\bplaysinline\b[^>]*\bpreload="none"[^>]*>/.test(workHtml) &&
    !/<video\b[^>]*\bid="paina-video"[^>]*\bdata-once\b/.test(workHtml) &&
    /<video\b[^>]*\bid="rana-studio-video"[^>]*\bmuted\b[^>]*\bplaysinline\b[^>]*\bpreload="none"[^>]*>/.test(workHtml) &&
    !/<video\b[^>]*\bid="rana-studio-video"[^>]*\bloop\b/.test(workHtml) &&
    /<video\b[^>]*\bid="rana-ring-video"[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b[^>]*\bpreload="none"[^>]*>/.test(workHtml) &&
    /<video\b[^>]*\bid="prorok-ink-video"[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b[^>]*\bpreload="none"[^>]*>/.test(workHtml) &&
    !/id="(?:paina-video|rana-studio-video|rana-ring-video|prorok-ink-video)"[\s\S]{0,260}\bautoplay\b/.test(workHtml),
  'Pā‘ina, the Rana follow-up, and Healed loop while the Rana master still hands off once and downstream carriers defer cold autoplay'
);
ok(
  /<video\b[^>]*\bid="generations-video"[^>]*\bloop\b/.test(workHtml) &&
    /<video\b[^>]*\bid="paina-video"[^>]*\bloop\b/.test(workHtml),
  'Loco Moco and Pā‘ina both keep moving while their scenes remain active'
);
ok(!/corridor-motion-video|corridor-entry-loop|layer-corridor/.test(workHtml), 'corridor is absent from Work markup and routing');
ok(
  !/blocked-pending-reuse-rights/.test(workHtml) &&
    workHtml.includes('../assets/work/generations/') &&
    workHtml.includes('../assets/work/paina/'),
  'approved portfolio carriers remain isolated behind replaceable project asset boundaries'
);
ok(!/src=["']https?:\/\//i.test(workHtml), 'no remote script/media src on work route');
ok(!/fonts\.gstatic\.com|fonts\.googleapis\.com/i.test(workHtml), 'no external font CDN');
ok(
  !workHtml.includes('class="generations-wash"') &&
    !workHtml.includes('.generations-wash{') &&
    !workHtml.includes('filter:saturate(1.04) contrast(1.04) brightness(calc(.98') &&
    /function drawMobileGenerationsScene\(ctx, sourceOverride\) \{[\s\S]*?return drawMobileCover\(ctx, source\);\s*\}/.test(workHtml),
  'Generations uses source pixels edge to edge without a portfolio grade, wash, or canvas gradients'
);
ok(
  workHtml.includes('html.generations-human-beat .scene-copy--generations') &&
    /function syncGenerationsHumanBeat\(\)[\s\S]*?t >= 0 && t < 0\.5[\s\S]*?root\.classList\.toggle\("generations-human-beat", active\)/.test(workHtml),
  'duplicate portfolio copy yields only for the natural woman shot'
);

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
  /\.terminal-return\s*\{[\s\S]*?object-fit\s*:\s*contain[\s\S]*?object-position\s*:\s*50% 50%[\s\S]*?transform\s*:\s*none/.test(workHtml),
  'terminal portrait preserves the complete centered source plate'
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
ok(!/class="scroll-invitation"|--entry-cue/.test(workHtml), 'no Scroll tollbooth precedes the moving Generations encounter');
ok(
  /\.layer-terminal\s*\{[\s\S]*?--mask-open\s*:\s*max\s*\(\s*0\.001\s*,\s*var\(--terminal-hold\)\s*\)/.test(workHtml),
  'terminal uses spatial mask aperture (not opacity primary)'
);
ok(
  !/\.layer-terminal\s*\{[^}]*opacity\s*:\s*var\(--terminal-hold\)/.test(workHtml),
  'terminal layer is not an opacity crossfade'
);
ok(/Motion-off snaps to five authored full-screen rests/i.test(workHtml), 'motion-off includes all five composed rests');
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
  /\.layer-paina\s*\{[\s\S]*?visibility\s*:\s*hidden/.test(workHtml) &&
    /\.layer-rana\s*\{[\s\S]*?visibility\s*:\s*hidden/.test(workHtml) &&
    /\.layer-prorok\s*\{[\s\S]*?visibility\s*:\s*hidden/.test(workHtml) &&
    /\.layer-paina\.is-revealing\s*\{\s*visibility\s*:\s*visible\s*\}/.test(workHtml) &&
    /\.layer-rana\.is-revealing\s*\{\s*visibility\s*:\s*visible\s*\}/.test(workHtml) &&
    /\.layer-prorok\.is-revealing\s*\{\s*visibility\s*:\s*visible\s*\}/.test(workHtml) &&
    /classList\.toggle\s*\(\s*["']is-revealing["']\s*,\s*painaOpen\s*>\s*0\s*\)/.test(workHtml) &&
    (workHtml.match(/classList\.toggle\s*\(\s*["']is-revealing["']/g) || []).length >= 3,
  'zero-state reveal gate holds Pā‘ina plus the inherited Rana and Prorok layers'
);
ok(workHtml.includes('scrollbar-width:none') || workHtml.includes('scrollbar-width: none'), 'native scrollbar hidden');
ok(
  !/#prorok-ink-video\s*\{\s*display\s*:\s*none/.test(workHtml) &&
    /\.prorok-healed\s*\{[\s\S]*?filter\s*:\s*none/.test(workHtml) &&
    /function drawMobileProrokScene\(ctx\)[\s\S]*?mobileSource\(inkVideo, prorokPortrait\)[\s\S]*?drawMobileHealedDisplay/.test(workHtml),
  'Dylan Healed montage is the ungraded moving subject carrier'
);
ok(!/class="motion-toggle"|id="motion-toggle"/.test(workHtml), 'Work renders no Motion On or Off control');
ok(/aria-label="Back to Jarrett"/.test(workHtml), 'wordmark accessible back label');
ok(workHtml.includes('no-js-route'), 'no-JS fallback on work route');
ok(/\.no-js-poster\s*\{[\s\S]*?height\s*:\s*auto/.test(workHtml), 'no-JS media preserves intrinsic aspect ratio');
ok(workHtml.includes('min-height:44px') || workHtml.includes('min-height: 44px'), '44px touch targets present');
// Mobile Rana rest: the all-rings master owns the frame until its native ended event.
ok(
  /function drawMobileRanaScene\(ctx\)[\s\S]*?ranaSequenceSecondary[\s\S]*?mobileSource\(studioVideo, ranaPoster\)[\s\S]*?drawMobileCover/.test(workHtml) &&
    /studioVideo\.addEventListener\("ended"[\s\S]*?setRanaSequenceSecondary\(true\)[\s\S]*?playSafe\(ringVideo\)/.test(workHtml),
  'mobile Rana starts full bleed on all rings and advances only when the master ends'
);

// Composition anti-patterns (markup-level)
ok(!/<iframe\b/i.test(workHtml), 'no iframe embeds');
ok(!/browser mockup|device frame|carousel|modal preview/i.test(workHtml), 'no mockup/carousel language');
ok(!/Selected Work|project\s*0[1-9]|design award|award-winning/i.test(workHtml), 'no portfolio UI labels, project ordinals, or award jargon');
ok(
  /params\.get\("identity"\) === "off"/.test(workHtml) &&
    /html\[data-identity="off"\] \.scene-copy\s*\{\s*display\s*:\s*none !important\s*\}/.test(workHtml),
  'identity-off control removes every project name, line, and action without changing world geometry'
);

// Assets present with frozen hashes (updated only when media bytes legitimately change)
const ranaHashes = {
  'assets/work/rana/all-rings-desktop-45b16c5d.mp4': '45b16c5d5a3fd5f1ceb85c39e38ee29fa665de42dc85813939ff68da96e670bb',
  'assets/work/rana/all-rings-desktop-7dd4e5ff.jpg': '7dd4e5ff727f206bcc9d6f3c7f8a95881171b4727b4b6cb06cb0ab391f50c252',
  'assets/work/rana/all-rings-mobile-937040ac.mp4': '937040ac79c9318ba9b57ad7258e96f46919e10e47267450f38c824b49260e73',
  'assets/work/rana/all-rings-mobile-4c1a45d4.jpg': '4c1a45d431caf8419b4279fe78d56ce544ba5f4bc61842788e94e39275b4495b',
  'assets/work/rana/alexandrite-desktop-cedccbe9.mp4': 'cedccbe95341ff61fc4a961344c9d8fd4422272d2a1dab561bfe38d718cff850',
  'assets/work/rana/alexandrite-desktop-b278dcbe.jpg': 'b278dcbee501a9ac28638b03c5eeabeba0d243f9f8e10707fbe299641d0961bb',
  'assets/work/rana/alexandrite-mobile-d0e351ff.mp4': 'd0e351ff372e4081e1ebce77018062313fc47088db7617f0a6ef6460fdb94450',
  'assets/work/rana/alexandrite-mobile-f24b465e.jpg': 'f24b465ee13a8105a2832191124b4f89aa51cd041d36f6f75e9e6c579774fc44',
};
for (const [rel, expected] of Object.entries(ranaHashes)) {
  const buf = mustExist(rel);
  if (buf) ok(sha256(buf) === expected, rel + ' SHA-256');
}
const prorokPortrait = mustExist('demos/dylan-prorok/healed-poster-mobile-7d9f16d1.jpg');
const prorokInk = mustExist('demos/dylan-prorok/healed-montage-desktop-854d3384.mp4');
const prorokInkMobile = mustExist('demos/dylan-prorok/healed-montage-mobile-18bdbd22.mp4');
const foodHashes = {
  'assets/work/generations/hurricane-fries-desktop-3p6.mp4': 'b3bb00655c631ee328dbb9b153320c5f9aa049fa0335024eec4b1a170b05855d',
  'assets/work/generations/hurricane-fries-desktop.jpg': '5d08fc59aa446b364693db2b99838f6b4ba15b2053e44d12ea33697c89eac846',
  'assets/work/generations/hurricane-fries-mobile-3p6.mp4': '83462b27bd7327a2a7d04a46d0890f8126721b4230141820328e8feb766209e6',
  'assets/work/generations/hurricane-fries-mobile.jpg': 'ff49242954f93e12b9d86e886e441c70df79793b41d027245e1598ef45b2085f',
  'assets/work/generations/loco-moco-natural-desktop-dc59bdf1.mp4': 'dc59bdf168f9a72f872c963a2a6cf005fc157ccb743953ca01e4fa947a3333db',
  'assets/work/generations/loco-moco-natural-desktop-0433595d.jpg': '0433595dd119a52482800c4f26f46fe7f4e2e52242a6d92089132e59bfc6a419',
  'assets/work/generations/loco-moco-natural-mobile-fc141d42.mp4': 'fc141d42d846612d286581764e09b07e6694b50e33715a64291a98d68ccdb8a2',
  'assets/work/generations/loco-moco-natural-mobile-1d88178b.jpg': '1d88178bd4fa429cd83f20a453f782c8016c72edb3f9ae3bf68d91cc45e0ad08',
  'assets/work/generations/generations-kitchen-logo-03eee381.png': '03eee381cb5d336dbf9197147bfe8f0e92725b58a154436ee631d305938c25de',
  'assets/work/paina/opening-desktop.mp4': 'ed99a05d492e5547b6a8c6b031f8560967cf1a84216e341642e4a73b470030dd',
  'assets/work/paina/opening-desktop-poster.jpg': 'c3bcae6ab8b434029520d944738d7a79be0b3e21b4806ecd3593153f6da21700',
  'assets/work/paina/opening-mobile-from-2p4.mp4': 'da23f85e89d36762b6e75c897f493d266fffcd4e43155bece14b5e9a0ff46259',
  'assets/work/paina/opening-mobile-entry-2p4.jpg': 'c013573d997c4f1770db8cfa5724f13f67f8eb32c2d471d791753dff3bcedc5e',
  'assets/work/paina/opening-mobile-poster.jpg': '8b3c1b6cc71f7aa9de1f62e0f0ef64e536e8f316371dee8ebd4f802eb460e110',
};
for (const [rel, expected] of Object.entries(foodHashes)) {
  const buf = mustExist(rel);
  if (buf) ok(sha256(buf) === expected, rel + ' SHA-256');
}
for (const retired of [
  'assets/work/generations/loco-moco-site-desktop-3b1c9987.mp4',
  'assets/work/generations/loco-moco-site-desktop-bf93bac9.jpg',
  'assets/work/generations/loco-moco-site-mobile-49849434.mp4',
  'assets/work/generations/loco-moco-site-mobile-ea703ae1.jpg',
]) ok(!fs.existsSync(path.join(ROOT, retired)), 'retired lower-quality carrier is absent: ' + retired);
ok(!fs.existsSync(path.join(ROOT, 'assets/work/paina/opening-mobile.mp4')), 'unused pre-2.4 Pā‘ina mobile carrier is absent');
const terminalPortrait = mustExist('assets/golden-arrival/frames/ga-360.webp');
if (prorokPortrait) {
  ok(sha256(prorokPortrait) === '7d9f16d13a1effc896e09e43084694d390260550b412fce827b9eb560fad6ef9', 'Dylan mobile Healed poster SHA-256');
}
if (prorokInk) {
  ok(sha256(prorokInk) === '854d3384573afb2ef1dbfaa637e333b98b79b507ef52d37f33bb84d79987ab2a', 'Dylan desktop Healed montage SHA-256');
}
if (prorokInkMobile) {
  ok(sha256(prorokInkMobile) === '18bdbd2263059f69f9424f12b183b768371bb2e68baac51c88478d37d8f9c472', 'Dylan mobile Healed montage SHA-256');
}
if (terminalPortrait) {
  ok(sha256(terminalPortrait) === '552fba13d339f46bf909735f3b629c5574545fd7626021e7f371d650149bf224', 'ga-360.webp SHA-256');
}
// Media weight gate: Pā‘ina is deferred by scene lifecycle; Generations stays compact at cold load.
const studioBytes = fs.statSync(path.join(ROOT, 'assets/work/rana/all-rings-desktop-45b16c5d.mp4')).size;
const inkBytes = fs.statSync(path.join(ROOT, 'demos/dylan-prorok/healed-montage-desktop-854d3384.mp4')).size;
const ringBytes = fs.statSync(path.join(ROOT, 'assets/work/rana/alexandrite-desktop-cedccbe9.mp4')).size;
const generationsDesktopBytes = fs.statSync(path.join(ROOT, 'assets/work/generations/loco-moco-natural-desktop-dc59bdf1.mp4')).size;
const generationsMobileBytes = fs.statSync(path.join(ROOT, 'assets/work/generations/loco-moco-natural-mobile-fc141d42.mp4')).size;
const painaDesktopBytes = fs.statSync(path.join(ROOT, 'assets/work/paina/opening-desktop.mp4')).size;
const painaMobileBytes = fs.statSync(path.join(ROOT, 'assets/work/paina/opening-mobile-from-2p4.mp4')).size;
ok(generationsDesktopBytes < 3_700_000, 'Generations direct-master CRF14 desktop carrier under 3.7 MB');
ok(generationsMobileBytes < 1_400_000, 'Generations direct-master CRF14 portrait carrier under 1.4 MB');
ok(generationsDesktopBytes + generationsMobileBytes + painaDesktopBytes + painaMobileBytes < 17_000_000, 'new motion carriers under 17 MB total across both breakpoints');
ok(studioBytes < 7_000_000, 'Rana ring-only master under 7 MB and deferred');
ok(ringBytes < 1_200_000, 'Rana Alexandrite follow-up under 1.2 MB');
ok(inkBytes < 2_300_000, 'Dylan desktop Healed montage under 2.3 MB');
// Do not duplicate ProRok binaries under work/
ok(!fs.existsSync(path.join(ROOT, 'work/healed-montage-desktop-854d3384.mp4')), 'no duplicated Dylan Healed video under work/');

// Type system inheritance
ok(/font-family:"Bodoni Moda"/.test(workHtml.replace(/\s+/g, '')) || workHtml.includes('font-family:"Bodoni Moda"'), 'Bodoni wired');
ok(workHtml.includes('IBM Plex Sans') && workHtml.includes('Rana Reader Fallback'), 'IBM + Rana reader wired');
ok(!/text-transform\s*:\s*uppercase/i.test(workHtml), 'no faux-technical uppercase');
ok(!/IBM Plex Mono|--mono\s*:/.test(workHtml), 'no mono register');

// JS parse check for work page inline script (extract and Function-wrap)
const scripts = [...workHtml.matchAll(/<script(?![^>]*src=)(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
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
  /nodes\[i\]\.style\.pointerEvents\s*=\s*active\s*\?\s*["']auto["']\s*:\s*["']none["']/.test(workHtml),
  'hidden scene actions cannot override their parent pointer-event gate'
);
ok(
  /setCopyAccess\(\s*copyGenerations/.test(workHtml) &&
    /setCopyAccess\(\s*copyPaina/.test(workHtml) &&
    /setCopyAccess\(\s*copyRana/.test(workHtml) &&
    /setCopyAccess\(\s*copyProrok/.test(workHtml) &&
    /setCopyAccess\(\s*copyTerminal/.test(workHtml),
  'all five scene-copy blocks use setCopyAccess'
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
    /\.layer-paina,\s*\.layer-rana,\s*\.layer-prorok,\s*\.layer-terminal\s*\{[\s\S]*?(?:-webkit-)?mask(?:-image)?\s*:\s*none/.test(mobileSheet),
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
    /\/\* Motion-off snaps to five authored full-screen rests[\s\S]*?applySceneValues\(withCopy\(values, copyValuesFromWorld\(values\)\)\)/
  );
  const motionOffSrc = motionOffPaint ? motionOffPaint[0] : '';
  ok(!!motionOffSrc, 'Motion Off composed-rest paint extractable');
  ok(
    /else if\s*\(\s*p\s*<\s*0\.89\s*\)[\s\S]*?else\s*\{[\s\S]*?terminalHold\s*:\s*1/.test(motionOffSrc) &&
      /generationsHold\s*:\s*1/.test(motionOffSrc) &&
      /painaHold\s*:\s*1/.test(motionOffSrc) &&
      /ranaHold\s*:\s*1/.test(motionOffSrc) &&
      /prorokHold\s*:\s*1/.test(motionOffSrc),
    'Motion Off last rest still assigns terminalHold = 1'
  );
  ok(
    !/\.passage-veil/.test(workHtml) && !/--passage-veil/.test(workHtml),
    'Motion Off has no passage-veil path to depend on'
  );
}

// Portfolio lineage — new worlds extend the incumbent compositor rather than replacing it.
{
  const generationsAt = workHtml.indexOf('id="layer-generations"');
  const painaAt = workHtml.indexOf('id="layer-paina"');
  const ranaAt = workHtml.indexOf('id="layer-rana"');
  const prorokAt = workHtml.indexOf('id="layer-prorok"');
  const terminalAt = workHtml.indexOf('id="layer-terminal"');
  ok(
    generationsAt >= 0 && generationsAt < painaAt && painaAt < ranaAt && ranaAt < prorokAt && prorokAt < terminalAt,
    'world stack order is Generations → Pā‘ina → Rana → Prorok → process'
  );
  ok(
    /\.viewport\s*\{[\s\S]*?position\s*:\s*sticky[\s\S]*?height\s*:\s*100svh/.test(workHtml) &&
      /\.layer\s*\{[\s\S]*?position\s*:\s*absolute[\s\S]*?inset\s*:\s*0/.test(workHtml),
    'new worlds retain the incumbent sticky viewport and absolute full-screen layer topology'
  );
  ok(
    /\.layer-generations\s*\{[\s\S]*?z-index\s*:\s*1/.test(workHtml) &&
      /\.layer-paina\s*\{[\s\S]*?z-index\s*:\s*2/.test(workHtml) &&
      /\.layer-rana\s*\{[\s\S]*?z-index\s*:\s*3/.test(workHtml) &&
      /\.layer-prorok\s*\{[\s\S]*?z-index\s*:\s*4/.test(workHtml),
    'new worlds prepend the inherited layer order without changing its topology'
  );
  ok(
    /--paina-core:max\(0\.001,var\(--paina-open\)\)/.test(workHtml.replace(/\s+/g, '')) &&
      /--paina-join:max\(0\.001,var\(--paina-side\)\)/.test(workHtml.replace(/\s+/g, '')) &&
      /at 52% 68%/.test(workHtml) &&
      /mask-composite:add/.test(workHtml),
    'Pā‘ina reveal grows from merging food-centered lobes rather than a rectangular wipe'
  );
  ok(
    !/clip-path\s*:\s*inset\(/.test(workHtml) &&
      !/grid-template-columns\s*:/.test(workHtml) &&
      !/class="[^"]*(?:card|panel|mockup|ordinal|eyebrow|kicker|rail)[^"]*"/i.test(
        (workHtml.match(/id="layer-generations"[\s\S]*?id="layer-rana"/) || [''])[0]
      ),
    'food passage contains no inset wipe, split grid, card, panel, portfolio rail, or identity furniture'
  );
  ok(
    /id="generations-video"[\s\S]*?<source media="\(max-width:720px\)"[^>]*loco-moco-natural-mobile-fc141d42\.mp4[\s\S]*?<source media="\(min-width:721px\)"[^>]*loco-moco-natural-desktop-dc59bdf1\.mp4/.test(workHtml) &&
      /id="paina-video"[\s\S]*?<source media="\(max-width:720px\)"[^>]*opening-mobile-from-2p4\.mp4[\s\S]*?<source media="\(min-width:721px\)"[^>]*opening-desktop\.mp4/.test(workHtml),
    'both food worlds carry breakpoint-exclusive desktop and portrait motion sources'
  );
}

/*
 * Focused tripwire — mobile My Work full-interval transitions.
 * Canonical path: work-smoke-test.mjs
 * Future consumer: Codex closer + every local Work-route revision before adoption.
 * Activation: execute `node work-smoke-test.mjs`
 * Behavioral check: five STILL rests; one-gesture / hidden 8000ms readiness
 * ceiling / 960ms visible atomic-canvas handoff / lock; a destination is ready only after its required video has a
 * decoded frame; outgoing rest stays painted until that promise resolves;
 * timeout/error/stale tokens cancel without advancing; the visible handoff
 * keeps exactly one authored rest authoritative and cuts on a named phase —
 * no passage-veil, blur plate, dissolve, or third visual; copy exits before
 * the cut and enters after; reverse uses the same readiness rule and cut
 * grammar; landing clears transition state after 960ms; wheel and keyboard
 * input advance one stop on every viewport while touch remains mobile; Motion Off
 * immediate; TAU = 0.41. Rejected silhouettes (expanding gem, bottom-up
 * stack, vertical tear, clip-path inset split, cyan/copper veil) stay gone.
 * Retirement: only when the five-rest mobile passage is replaced.
 */
{
  ok(
    /generations:\s*0\.04/.test(workHtml) &&
      /paina:\s*0\.26/.test(workHtml) &&
      /rana:\s*0\.566/.test(workHtml) &&
      /prorok:\s*0\.79/.test(workHtml) &&
      /process:\s*0\.958/.test(workHtml),
    'STILL rests are Generations 0.04, Pā‘ina 0.26, Rana 0.566, Prorok 0.79, process 0.958'
  );
  ok(
    /MOBILE_STOPS\s*=\s*\[[\s\S]*?id:\s*"generations"[\s\S]*?STILL\.generations[\s\S]*?id:\s*"paina"[\s\S]*?STILL\.paina[\s\S]*?id:\s*"rana"[\s\S]*?STILL\.rana[\s\S]*?id:\s*"prorok"[\s\S]*?STILL\.prorok[\s\S]*?id:\s*"process"[\s\S]*?STILL\.process/.test(workHtml),
    'mobile stops derive from STILL in Generations → Pā‘ina → Rana → Prorok → process order'
  );
  const workStops = [
    ['generations', 0.04],
    ['paina', 0.26],
    ['rana', 0.566],
    ['prorok', 0.79],
    ['process', 0.958],
  ];
  ok(workStops.length === 5, 'exactly five authored mobile rests');
  const nextWorkStop = (index, direction) => Math.max(0, Math.min(workStops.length - 1, index + Math.sign(direction)));
  const forward = [];
  let stopIndex = 0;
  for (let i = 0; i < 6; i++) {
    stopIndex = nextWorkStop(stopIndex, 1);
    forward.push(workStops[stopIndex][0]);
  }
  ok(
    JSON.stringify(forward) === JSON.stringify(['paina', 'rana', 'prorok', 'process', 'process', 'process']),
    'four forward gestures reach process; further forward stays at process'
  );
  const reverse = [];
  for (let i = 0; i < 6; i++) {
    stopIndex = nextWorkStop(stopIndex, -1);
    reverse.push(workStops[stopIndex][0]);
  }
  ok(
    JSON.stringify(reverse) === JSON.stringify(['prorok', 'rana', 'paina', 'generations', 'generations', 'generations']),
    'reverse gestures unwind one rest at a time and stay at Generations'
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
      /function mobileNavigationBusy\(\)[\s\S]*?return mobileGlideLocked \|\| mobileWaiting \|\| breakpointSwapActive/.test(workHtml) &&
      /function advanceMobileStop\(direction\)[\s\S]*?if \(mobileNavigationBusy\(\) \|\| !direction\) return false/.test(workHtml) &&
      /function onMobileTouchStart\(e\)[\s\S]*?mobileNavigationBusy/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?if \(!mobileNavigationBusy\(\)\) advanceMobileStop/.test(workHtml),
    'pending readiness and the authored glide block stop-skipping on every viewport'
  );

  ok(
    /var MOBILE_BREAKPOINT_PX = 720/.test(workHtml) &&
      workHtml.includes('matchMedia("(max-width:" + MOBILE_BREAKPOINT_PX + "px)")') &&
      /function passageGestureAvailable\(\)[\s\S]*?return !!passage && !!viewport && passageOwnsViewport\(\) && !isOpenOverlay\(\)/.test(workHtml) &&
      /function onMobileWheel\(e\)[\s\S]*?if \(!passageGestureAvailable\(\)\) return;[\s\S]*?e\.preventDefault\(\)/.test(workHtml),
    'one-project wheel lock applies whenever the Work passage owns the viewport'
  );
  ok(
    /function onMobileBreakpointChange\(event\)[\s\S]*?beginBreakpointSwap\(!!event\.matches\)/.test(workHtml) &&
      /mobileMq\.addEventListener\("change", onMobileBreakpointChange\)/.test(workHtml) &&
      /function beginBreakpointSwap\(targetMobile\)[\s\S]*?cancelMobileGlide\(\)[\s\S]*?pauseSafe\(generationsVideo\)[\s\S]*?pauseSafe\(painaVideo\)/.test(workHtml) &&
      /function beginBreakpointSwap[\s\S]*?reloadFoodVideoForBreakpoint\(generationsVideo\)[\s\S]*?reloadFoodVideoForBreakpoint\(painaVideo\)[\s\S]*?requestFoodPosterForBreakpoint\(generationsPoster[\s\S]*?requestFoodPosterForBreakpoint\(painaPoster/.test(workHtml) &&
      /function reloadFoodVideoForBreakpoint\(video\)[\s\S]*?resetVideoReadinessState\(video\)[\s\S]*?video\.load\(\)/.test(workHtml),
    'one breakpoint transaction cancels the handoff and concurrently requests both target food representations'
  );
  ok(
    /html\.mobile-plate-active \.mobile-scene-plate,\s*html\.source-swap-active \.mobile-scene-plate\s*\{[\s\S]*?display\s*:\s*block[\s\S]*?opacity\s*:\s*1/.test(workHtml) &&
      /\.mobile-scene-plate\s*\{[\s\S]*?object-fit\s*:\s*contain[\s\S]*?object-position\s*:\s*50% 50%/.test(workHtml) &&
      /function beginBreakpointSwap[\s\S]*?breakpointSwapGeneration[\s\S]*?source-swap-active/.test(workHtml) &&
      /function finishBreakpointSwap\(token, targetMobile, index, targetReady\)[\s\S]*?token !== breakpointSwapGeneration[\s\S]*?clearBreakpointSwapWatch\(\)[\s\S]*?breakpointSwapActive = false/.test(workHtml) &&
      /function breakpointWorldReady\(video, poster, targetMobile\)[\s\S]*?videoReady \|\| posterReady/.test(workHtml) &&
      /breakpointSwapTimer = window\.setTimeout\(function \(\)[\s\S]*?finishBreakpointSwap\(token, targetMobile, breakpointSwapStopIndex, false\)/.test(workHtml),
    'breakpoint swap accepts video OR poster, preserves an undistorted plate, and every deadline resolves the transaction'
  );
  {
    const worldReadySrc = (workHtml.match(/function breakpointWorldReady\(video, poster, targetMobile\) \{[\s\S]*?\n  \}/) || [''])[0];
    let worldReady;
    try {
      worldReady = new Function(
        'foodVideoMatchesMode',
        'videoHasRenderableFrame',
        'foodPosterMatchesMode',
        'imageHasRenderableFrame',
        worldReadySrc + '; return breakpointWorldReady;'
      )(
        (video) => !!video.correct,
        (video) => !!video.renderable,
        (poster) => !!poster.correct,
        (poster) => !!poster.renderable
      );
    } catch (error) {
      failures.push('breakpointWorldReady parse: ' + error.message);
    }
    ok(typeof worldReady === 'function', 'breakpoint world readiness helper is extractable');
    if (typeof worldReady === 'function') {
      ok(worldReady({ correct:true, renderable:true }, { correct:true, renderable:false }, true), 'correct decoded video settles despite a missing poster');
      ok(worldReady({ correct:true, renderable:false }, { correct:true, renderable:true }, true), 'correct decoded poster settles despite a missing video');
      ok(!worldReady({ correct:true, renderable:false }, { correct:true, renderable:false }, true), 'neither target representation remains pending until the bounded deadline');
      ok(!worldReady({ correct:false, renderable:true }, { correct:false, renderable:true }, true), 'wrong-mode decoded bytes cannot settle a target mode');
    }
  }
  ok(
    /breakpointFallbackOwnerIndex = targetReady \? -1 : index/.test(workHtml) &&
      /function paint\(p\)[\s\S]*?breakpointFallbackActive && !isMobile\(\)[\s\S]*?semanticIndex === breakpointFallbackOwnerIndex[\s\S]*?setMobilePlateActive\(true\)[\s\S]*?completeSceneValuesForRest\(breakpointFallbackOwnerIndex\)[\s\S]*?setMobilePlateActive\(false\)[\s\S]*?completeSceneValuesForRest\(semanticIndex\)/.test(workHtml) &&
      /function beginBreakpointSwap[\s\S]*?breakpointFallbackActive = false[\s\S]*?breakpointFallbackOwnerIndex = -1/.test(workHtml) &&
      /function preserveBreakpointPlate[\s\S]*?heldCanvas[\s\S]*?renderMobilePlate\(index, mobileSceneValuesForRest\(index\), source\)/.test(workHtml),
    'breakpoint fallback is owned by one semantic rest, yields to valid worlds, restores its held plate, and clears on supersession'
  );

  ok(
    /function scrollToMobileStopIndex\(index\)[\s\S]*?behavior:\s*"auto"/.test(workHtml) &&
      /function glideScrollTo\(top\)[\s\S]*?if \(!motionOn \|\| Math\.abs\(distance\) < 0\.5\)[\s\S]*?window\.scrollTo\(0, top\)/.test(workHtml),
    'Motion Off lands on the same five stops immediately without an animated glide'
  );

  const desktopCss = workHtml.split(/@media\s*\(\s*max-width\s*:\s*720px\s*\)/)[0];
  ok(!/scroll-snap(?:-type|-align|-stop)?\s*:/.test(workHtml), 'no CSS scroll-snap');
  ok(!/touch-action\s*:/.test(desktopCss), 'desktop CSS does not lock touch-action');
  ok(
    /@media\s*\(\s*max-width\s*:\s*720px\s*\)[\s\S]*?touch-action\s*:\s*pan-x pinch-zoom/.test(workHtml),
    'mobile-only touch-action owns vertical travel while leaving pinch and horizontal free'
  );
  ok(
    /One deliberate keypress advances one locked portfolio world/.test(workHtml) &&
      /document\.addEventListener\("keydown"[\s\S]*?if \(e\.repeat\) return;[\s\S]*?if \(mobileNavigationBusy\(\)\) return;[\s\S]*?advanceMobileStop\(direction\)/.test(workHtml),
    'one deliberate keyboard input advances one locked portfolio stop without repeats'
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
      /function onMobileWheel\(e\)[\s\S]*?passageGestureAvailable\(\)/.test(workHtml) &&
      /function isOpenOverlay\(\)[\s\S]*?aria-modal/.test(workHtml),
    'touch controls remain interactive and an open overlay releases every passage gesture'
  );
  ok(
    /window\.WORK_PASSAGE = \{[\s\S]*?mobileStopIndex[\s\S]*?mobileGliding[\s\S]*?mobileWaiting[\s\S]*?mobileRequestedStop[\s\S]*?goMobileStop:\s*scrollToMobileStopIndex/.test(workHtml) &&
      /get mobileTransition\(\) \{[\s\S]*?fromIndex[\s\S]*?toIndex[\s\S]*?t:/.test(workHtml) &&
      /get videoReadiness\(\) \{[\s\S]*?generations:[\s\S]*?paina:[\s\S]*?studio:[\s\S]*?ring:[\s\S]*?ink:/.test(workHtml) &&
      /readinessMs:\s*MOBILE_READINESS_MS/.test(workHtml),
    'WORK_PASSAGE exposes waiting, requested destination, per-video readiness, and the real navigation function'
  );
  ok(fs.existsSync(path.join(ROOT, 'PORTFOLIO-MAINTENANCE.md')), 'portfolio maintenance and test contract lives outside runtime source');

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
  const generationsVideo = { id: 'generations', currentSrc: 'http://local/assets/work/generations/loco-moco-natural-mobile-fc141d42.mp4' };
  const painaVideo = { id: 'paina', currentSrc: 'http://local/assets/work/paina/opening-mobile-from-2p4.mp4' };
  const studioVideo = { id: 'studio' };
  const ringVideo = { id: 'ring' };
  const inkVideo = { id: 'ink' };
  const generationsPoster = { id: 'generations-poster', currentSrc: 'http://local/assets/work/generations/loco-moco-natural-mobile-1d88178b.jpg', complete: true, naturalWidth: 448, naturalHeight: 968 };
  const painaPoster = { id: 'paina-poster', currentSrc: 'http://local/assets/work/paina/opening-mobile-entry-2p4.jpg', complete: true, naturalWidth: 720, naturalHeight: 1280 };
  const ranaPoster = { id: 'rana-poster', complete: true, naturalWidth: 498, naturalHeight: 1080 };
  const ringPoster = { id: 'ring-poster', complete: true, naturalWidth: 720, naturalHeight: 1560 };
  const prorokPortrait = { id: 'prorok-portrait', complete: true, naturalWidth: 720, naturalHeight: 960 };
  const terminalReturn = { id: 'terminal-return', complete: true, naturalWidth: 1280, naturalHeight: 720 };
  if (videosForMatch) {
    try {
      videosForMobileStop = new Function(
        'generationsVideo',
        'painaVideo',
        'studioVideo',
        'ringVideo',
        'inkVideo',
        videosForMatch[0] + '; return videosForMobileStop;'
      )(generationsVideo, painaVideo, studioVideo, ringVideo, inkVideo);
    } catch (e) {
      failures.push('videosForMobileStop parse: ' + e.message);
    }
  }
  ok(typeof videosForMobileStop === 'function', 'videosForMobileStop runs as a function');
  if (typeof videosForMobileStop === 'function') {
    const sameRefs = (got, expected) =>
      got.length === expected.length && got.every((video, i) => video === expected[i]);
    ok(sameRefs(videosForMobileStop('generations'), [generationsVideo]), 'Generations destination is its portrait food carrier');
    ok(sameRefs(videosForMobileStop('paina'), [painaVideo]), 'Pā‘ina destination is its portrait kitchen carrier');
    ok(sameRefs(videosForMobileStop('rana'), [studioVideo]), 'Rana destination starts on the all-rings master');
    ok(sameRefs(videosForMobileStop('prorok'), [inkVideo]), 'Prorok destination is the Healed montage');
    ok(sameRefs(videosForMobileStop('process'), []), 'process destination has no video to force-play');

    const expectedByStop = {
      generations: [generationsVideo],
      paina: [painaVideo],
      rana: [studioVideo],
      prorok: [inkVideo],
      process: [],
    };
    let prewarmBothWays = true;
    for (let i = 0; i < workStops.length - 1; i++) {
      const fromId = workStops[i][0];
      const toId = workStops[i + 1][0];
      const forwardDest = videosForMobileStop(toId);
      const reverseDest = videosForMobileStop(fromId);
      const expectedForward = expectedByStop[toId];
      const expectedReverse = expectedByStop[fromId];
      if (
        forwardDest.length !== expectedForward.length ||
        forwardDest.some((video, index) => video !== expectedForward[index]) ||
        reverseDest.length !== expectedReverse.length ||
        reverseDest.some((video, index) => video !== expectedReverse[index])
      ) prewarmBothWays = false;
    }
    ok(prewarmBothWays, 'forward and reverse prepare only the moving carrier required by the destination rest');
  }

  const requestSrc = (workHtml.match(/function requestMobileVideo\(video, shouldPlay\) \{[\s\S]*?\n  \}/) || [''])[0];
  const prepareSrc = (workHtml.match(/function prepareMobileDestination\(index\) \{[\s\S]*?\n  \}/) || [''])[0];
  const glideSrc = (workHtml.match(/function glideScrollTo\(top\) \{[\s\S]*?\n  \}/) || [''])[0];
  const waitSrc = (workHtml.match(/function waitForMobileDestinationReady\(id, token, onDone\) \{[\s\S]*?\n  \}/) || [''])[0];
  const scrollSrc = (workHtml.match(/function scrollToMobileStopIndex\(index\) \{[\s\S]*?\n  \}/) || [''])[0];
  const warmSrc = (workHtml.match(/function warmMobileBeatVideos\(\) \{[\s\S]*?\n  \}/) || [''])[0];
  ok(!!requestSrc && !!prepareSrc && !!glideSrc && !!waitSrc && !!scrollSrc, 'request/prepare/wait/glide functions are extractable');
  ok(
    /video\.preload = "auto"/.test(requestSrc) &&
      /if \(shouldPlay\) \{\s*playSafe\(video\)/.test(requestSrc) &&
      /requestMobileVideo/.test(prepareSrc) &&
      /requestMobileVideo\(generationsVideo, true\)/.test(warmSrc) &&
      !/requestMobileVideo\((?:painaVideo|studioVideo|ringVideo|inkVideo)/.test(warmSrc) &&
      /if \(motionOn\) \{[\s\S]*?warmMobileBeatVideos\(\)/.test(workHtml),
    'cold load requests only Generations before the next destination is chosen'
  );
  ok(
    /addEventListener\("loadeddata"/.test(workHtml) &&
      /addEventListener\("canplay"/.test(workHtml) &&
      /requestVideoFrameCallback/.test(workHtml) &&
      /readyState < 2/.test(workHtml) &&
      /opening-mobile-from-2p4\.mp4/.test(workHtml) &&
      !/seekPainaMobileEntry|PAINA_MOBILE_ENTRY_S|painaVideo\.currentTime\s*=/.test(workHtml),
    'Pā‘ina match frame is encoded at derivative time zero; runtime seeking and reverse rewinds are absent'
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
    /if \(elapsed < 1\) mobileScrollRaf = window\.requestAnimationFrame\(glide\);\s*else \{\s*window\.scrollTo\(0, top\);\s*mobileScrollRaf = 0;\s*mobileTransition = null;\s*progressTarget = progressCurrent = computeProgress\(\);\s*paint\(progressCurrent\);\s*syncVideos\(progressCurrent\);\s*mobileGlideLocked = false;\s*clearMobileDestination\(\);/.test(workHtml),
    'landing clears transition state, synchronizes exact rest scroll, and unlocks only after the 960ms clock'
  );
  ok(
    /function cancelMobileGlide\(\)[\s\S]*?clearMobileDestination\(\)/.test(workHtml) &&
      /function prepareMobileDestination\(index\)[\s\S]*?requestMobileVideo\(videos\[i\], false\)/.test(workHtml) &&
      /function prepareMobileDestination\(index\)[\s\S]*?mobileDestinationId === "rana"[\s\S]*?requestMobileVideo\(ringVideo, false\)/.test(workHtml) &&
      /function syncVideos\(p\)[\s\S]*?if \(activeId === "rana"\) enterRanaSequence\(\)[\s\S]*?if \(activeId === "prorok"\) enterProrokSequence\(\)/.test(workHtml) &&
      !/videoIsPreparedDestination/.test(workHtml),
    'moving destinations decode before arrival while Rana sequences and Dylan plays Healed'
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
    const to = 0.26;
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
        /function paint\(p\)[\s\S]*?sceneValuesFromMap\(p\)/.test(workHtml),
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
        /\.layer-paina\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--paina-open\)/.test(mobileSheet) &&
        /\.layer-rana\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--rana-open\)/.test(mobileSheet) &&
        /\.layer-prorok\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--prorok-open\)/.test(mobileSheet) &&
        /\.layer-terminal\.is-revealing\s*\{[^}]*opacity\s*:\s*var\(--terminal-hold\)/.test(mobileSheet),
      'mobile handoff keeps full-bleed plates with no veil or split-screen clip'
    );
    ok(
      /<canvas class="mobile-scene-plate" id="mobile-scene-plate"><\/canvas>/.test(workHtml) &&
        /\.mobile-scene-plate\s*\{[\s\S]*?z-index\s*:\s*10[\s\S]*?background\s*:\s*var\(--void\)/.test(workHtml) &&
        /html\.mobile-plate-active \.world-stack > \.layer[\s\S]*?visibility\s*:\s*hidden/.test(mobileSheet),
      'mobile recipient sees one opaque canvas while legacy media layers remain hidden below it'
    );
    ok(
      /function renderMobilePlate\(index, values, sourceOverride\)[\s\S]*?composeMobileScene\(index, sourceOverride\)[\s\S]*?drawImage\(mobileSceneBuffer, 0, 0\)[\s\S]*?setMobilePlateActive\(true\)/.test(workHtml) &&
        !/mobilePlateCtx\.scale\(/.test(workHtml) &&
        /function drawMobileContain\(ctx, source\)[\s\S]*?Math\.min\(mobilePlateWidth \/ size\.width, mobilePlateHeight \/ size\.height\)/.test(workHtml) &&
        /html\.mobile-plate-active \.world-stack\s*\{[\s\S]*?transform\s*:\s*none/.test(mobileSheet),
      'mobile compositor centers a complete source plate without scale or focus motion'
    );
    {
      const renderSrc = (workHtml.match(/function renderMobilePlate\(index, values, sourceOverride\) \{[\s\S]*?\n  \}/) || [''])[0];
      const composeAt = renderSrc.indexOf('composeMobileScene(index, sourceOverride)');
      const visibleClearAt = renderSrc.indexOf('mobilePlateCtx.fillRect');
      ok(
        /if \(!composeMobileScene\(index, sourceOverride\)\) return false;/.test(renderSrc) &&
          composeAt >= 0 && visibleClearAt > composeAt &&
          /mobileSceneBufferCtx/.test(workHtml) &&
          /mobileMaskBufferCtx/.test(workHtml),
        'a failed source draw retains the last complete visible frame; only a completed off-DOM buffer may publish'
      );
    }
    ok(
      /\.scene-copy--generations\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-generations\)/.test(mobileSheet) &&
        /\.scene-copy--paina\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-paina\)/.test(mobileSheet) &&
        /\.scene-copy--rana\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-rana\)/.test(mobileSheet) &&
        /\.scene-copy--prorok\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-prorok\)/.test(mobileSheet) &&
        /\.scene-copy--terminal\s*\{[\s\S]*?opacity\s*:\s*var\(--copy-terminal\)/.test(mobileSheet),
      'mobile copy is gated independently of world composition'
    );
    ok(
      !/\.scene-copy--generations\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        !/\.scene-copy--paina\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        !/\.scene-copy--rana\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        !/\.scene-copy--prorok\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        !/\.scene-copy--terminal\s*\{[^}]*filter\s*:\s*blur/.test(mobileSheet) &&
        /\.scene-copy--generations\s*\{[\s\S]*?filter\s*:\s*none/.test(mobileSheet) &&
        /\.scene-copy--paina\s*\{[\s\S]*?filter\s*:\s*none/.test(mobileSheet) &&
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
    const introMatch = workHtml.match(/var INTRO = \{[\s\S]*?\n  \};/);
    const mapMatch = workHtml.match(/var MAP = \{[\s\S]*?\n  \};/);
    const stillMatch = workHtml.match(/var STILL = \{[\s\S]*?\n  \};/);
    const stopsMatch = workHtml.match(/var MOBILE_STOPS = \[[\s\S]*?\];/);
    const tailDecl = (workHtml.match(/var TAIL_START = [0-9.]+;/) || [''])[0];
    const cutDecl = (workHtml.match(/var MOBILE_CUT_PHASE = [0-9.]+;/) || [''])[0];
    const copyOutDecl = (workHtml.match(/var MOBILE_COPY_OUT_END = [0-9.]+;/) || [''])[0];
    const copyInDecl = (workHtml.match(/var MOBILE_COPY_IN_START = [0-9.]+;/) || [''])[0];
    const parts = [
      extractFunction('clamp'),
      extractFunction('smoothstep'),
      extractFunction('range'),
      extractFunction('plateau'),
      extractFunction('span'),
      extractFunction('mobilePairClock'),
      extractFunction('copyValuesFromWorld'),
      extractFunction('withCopy'),
      tailDecl,
      introMatch ? introMatch[0] : '',
      mapMatch ? mapMatch[0] : '',
      stillMatch ? stillMatch[0] : '',
      stopsMatch ? stopsMatch[0] : '',
      cutDecl,
      copyOutDecl,
      copyInDecl,
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
      'generationsHold',
      'painaOpen',
      'painaSide',
      'painaHold',
      'ranaOpen',
      'ranaHold',
      'ring',
      'prorokOpen',
      'prorokHold',
      'terminalHold',
      'copyGenerations',
      'copyPaina',
      'copyRana',
      'copyProrok',
      'copyTerminal',
      'plateScale',
      'plateShift',
    ];
    const worldKeys = [
      'generationsHold',
      'painaOpen',
      'painaSide',
      'painaHold',
      'ranaOpen',
      'ranaHold',
      'ring',
      'prorokOpen',
      'prorokHold',
      'terminalHold',
    ];
    const opacityKeys = ['painaOpen', 'ranaOpen', 'prorokOpen', 'terminalHold'];
    const copyKeys = ['copyGenerations', 'copyPaina', 'copyRana', 'copyProrok', 'copyTerminal'];
    const COPY_EPS = 1e-4;
    const dist = (a, b) => Math.sqrt(keys.reduce((sum, key) => sum + ((a[key] || 0) - (b[key] || 0)) ** 2, 0));
    const sameValues = (a, b) => keys.every((key) => Math.abs((a[key] || 0) - (b[key] || 0)) <= 1e-9);
    const sameWorld = (a, b) => worldKeys.every((key) => Math.abs((a[key] || 0) - (b[key] || 0)) <= 1e-9);
    const hasWorld = (v) =>
      v.generationsHold > 0.02 ||
      v.painaOpen > 0.02 ||
      v.ranaOpen > 0.02 ||
      v.prorokOpen > 0.02 ||
      v.terminalHold > 0.02;
    const copyKeyForStop = (index) => {
      if (index === 0) return 'copyGenerations';
      if (index === 1) return 'copyPaina';
      if (index === 2) return 'copyRana';
      if (index === 3) return 'copyProrok';
      if (index === 4) return 'copyTerminal';
      return null;
    };
    const copyValue = (v, index) => {
      const key = copyKeyForStop(index);
      return key ? (v[key] || 0) : 0;
    };
    const liveCopyCount = (v) => copyKeys.filter((key) => (v[key] || 0) > COPY_EPS).length;
    const topWorld = (v) => {
      if (v.terminalHold > 0.5) return 4;
      if (v.prorokOpen > 0.5) return 3;
      if (v.ranaOpen > 0.5) return 2;
      if (v.painaOpen > 0.5) return 1;
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
      [3, 4],
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
      const mapAtMidFirst = sceneValuesFromMap(0.04 + (0.26 - 0.04) * 0.5);
      const localAtMidFirst = mobileSceneValuesForTransition(0, 1, 0.5);
      ok(
        mapAtMidFirst.painaOpen < 0.25 && localAtMidFirst.painaOpen > 0.9,
        'during Motion On glide, visible Pā‘ina is authored by local t, not the global intro window'
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
          if (!cameraNeutral(forward) || !cameraNeutral(reverse)) cameraContract = false;
          if (Math.abs((forward.plateScale || 1) - (reverse.plateScale || 1)) > 1e-9) reverseGrammar = false;
          if (Math.abs((forward.plateShift || 0) + (reverse.plateShift || 0)) > 1e-9) reverseGrammar = false;
          const weights = mobileCopyWeights(t);
          if (t > 0 && t < 1 && (weights.outgoing > COPY_EPS && weights.incoming > COPY_EPS)) copyTiming = false;
        }
      }
      ok(endpointsMatch, 'local t=0 matches the source rest and t=1 matches the destination rest');
      ok(midpointsMoved, 'at t=.25, .50, and .75 every transition has a materially changed visible state');
      ok(worldsPresent, 'no forward or reverse sample leaves all authoritative world layers absent');
      ok(hasWorld(mobileSceneValuesForRest(0)), 'Generations rest counts as a world through its full-screen carrier');
      ok(hasWorld(mobileSceneValuesForRest(1)), 'Pā‘ina rest counts as a world');
      ok(hasWorld(mobileSceneValuesForRest(2)), 'Rana rest still counts as a world');
      ok(hasWorld(mobileSceneValuesForRest(3)), 'Prorok rest still counts as a world');
      ok(hasWorld(mobileSceneValuesForRest(4)), 'process rest still counts as a world');
      const zeroedRest = Object.assign({}, mobileSceneValuesForRest(1));
      worldKeys.forEach((key) => { zeroedRest[key] = 0; });
      zeroedRest.copyGenerations = 0;
      zeroedRest.copyPaina = 0;
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
      ok(cameraContract, 'complete plate geometry stays neutral at rests and throughout each glide');
      ok(reverseGrammar, 'reverse transitions preserve the same neutral plate geometry');

      ok(typeof mobilePairClock === 'function', 'pair renderer has a local wall-time clock');
      if (typeof mobilePairClock === 'function') {
        ok(
          Math.abs(mobilePairClock(0)) < 1e-12 && Math.abs(mobilePairClock(1) - 1) < 1e-12,
          'pair clock endpoints are 0 and 1'
        );
        const t250 = mobilePairClock(250 / 960);
        ok(t250 >= 250 / 960 - 1e-12, 'pair clock is not slower than linear wall time at 250ms');
        let early = true;
        for (const [fromIndex, toIndex] of pairs) {
          const origin = mobileSceneValuesForTransition(fromIndex, toIndex, mobilePairClock(0));
          const at250 = mobileSceneValuesForTransition(fromIndex, toIndex, t250);
          if (dist(at250, origin) < 0.12) early = false;
        }
        ok(early, 'every adjacent pair shows authored change by 250ms');
        ok(cameraContract, 'no transition motion is manufactured by cropping or shifting the plate');
      }
    }
  }

  const syncMatch = workHtml.match(/function syncVideos\(p\) \{[\s\S]*?\n  \}/);
  ok(!!syncMatch, 'syncVideos is extractable for media lifecycle checks');
  if (syncMatch) {
    const played = [];
    const paused = [];
    const syncDesktop = new Function(
      'motionOn',
      'armVideos',
      'playSafe',
      'pauseSafe',
      'enterRanaSequence',
      'leaveRanaSequence',
      'enterProrokSequence',
      'leaveProrokSequence',
      'videoIsPreparedDestination',
      'generationsVideo',
      'painaVideo',
      'studioVideo',
      'ringVideo',
      'inkVideo',
      'breakpointSwapActive',
      'function isMobile(){ return false; }\n' + syncMatch[0] + '; return syncVideos;'
    )(
      true,
      function armVideos() {},
      function playSafe(video) { played.push(video.id); },
      function pauseSafe(video) { paused.push(video.id); },
      function enterRanaSequence() { played.push('studio'); paused.push('ring'); },
      function leaveRanaSequence() { paused.push('studio', 'ring'); },
      function enterProrokSequence() { played.push('ink'); },
      function leaveProrokSequence() { paused.push('ink'); },
      function videoIsPreparedDestination() { return false; },
      generationsVideo,
      painaVideo,
      studioVideo,
      ringVideo,
      inkVideo,
      false
    );

    syncDesktop(0.04);
    ok(
      played.includes('generations') &&
        ['paina', 'studio', 'ring', 'ink'].every((id) => paused.includes(id)),
      'desktop cold load plays only Generations'
    );
    played.length = 0;
    paused.length = 0;
    syncDesktop(0.20);
    ok(
      played.includes('generations') && played.includes('paina') &&
        ['studio', 'ring', 'ink'].every((id) => paused.includes(id)),
      'desktop first handoff pre-rolls Pā‘ina while Generations still contributes'
    );
    played.length = 0;
    paused.length = 0;
    syncDesktop(0.58);
    ok(
      played.includes('studio') && !played.includes('ring') &&
        ['generations', 'paina', 'ink'].every((id) => paused.includes(id)),
      'desktop Rana rest starts only the all-rings master'
    );
    played.length = 0;
    paused.length = 0;
    syncDesktop(0.80);
    ok(
      played.includes('ink') &&
        ['generations', 'paina', 'studio', 'ring'].every((id) => paused.includes(id)),
      'desktop Prorok rest plays only the Healed montage'
    );

    const mobilePlayed = [];
    const mobilePaused = [];
    const syncMobile = new Function(
      'motionOn',
      'armVideos',
      'playSafe',
      'pauseSafe',
      'enterRanaSequence',
      'leaveRanaSequence',
      'enterProrokSequence',
      'leaveProrokSequence',
      'generationsVideo',
      'painaVideo',
      'studioVideo',
      'ringVideo',
      'inkVideo',
      'breakpointSwapActive',
      'mobileTransition',
      'MOBILE_STOPS',
      'videosForMobileStop',
      'mobileStopIndexAtProgress',
      'mobileAuthoritativeIndex',
      'function isMobile(){ return true; }\n' + syncMatch[0] + '; return syncVideos;'
    )(
      true,
      function armVideos() {},
      function playSafe(video) { mobilePlayed.push(video.id); },
      function pauseSafe(video) { mobilePaused.push(video.id); },
      function enterRanaSequence() { mobilePlayed.push('studio'); mobilePaused.push('ring'); },
      function leaveRanaSequence() { mobilePaused.push('studio', 'ring'); },
      function enterProrokSequence() { mobilePlayed.push('ink'); },
      function leaveProrokSequence() { mobilePaused.push('ink'); },
      generationsVideo,
      painaVideo,
      studioVideo,
      ringVideo,
      inkVideo,
      false,
      null,
      workStops.map((stop) => ({ id: stop[0], progress: stop[1] })),
      videosForMobileStop,
      function mobileStopIndexAtProgress(p) { return p >= workStops[2][1] ? 2 : 0; },
      function mobileAuthoritativeIndex() { return 0; }
    );
    syncMobile(0.04);
    ok(
      mobilePlayed.includes('generations') &&
        ['paina', 'ring', 'ink', 'studio'].every((id) => mobilePaused.includes(id)),
      'mobile keeps the complete outgoing Generations rest while prepared Pā‘ina remains paused at time zero'
    );
    mobilePlayed.length = 0;
    mobilePaused.length = 0;
    syncMobile(workStops[2][1]);
    ok(
      mobilePlayed.includes('studio') && !mobilePlayed.includes('ring') &&
        ['generations', 'paina', 'ink', 'ring'].every((id) => mobilePaused.includes(id)),
      'mobile Rana rest starts only the all-rings master'
    );
  }

  ok(
    /function cancelMobileGlide\(\)[\s\S]*?cancelMobileReadiness\(\)/.test(workHtml) &&
      /function applyMotionPreference\([\s\S]*?cancelMobileGlide\(\)/.test(workHtml) &&
      /function beginBreakpointSwap\([\s\S]*?cancelMobileGlide\(\)/.test(workHtml) &&
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
    extractNamedFunction('sourcePathEndsWith'),
    extractNamedFunction('expectedFoodVideoPath'),
    extractNamedFunction('expectedFoodPosterPath'),
    extractNamedFunction('foodVideoMatchesMode'),
    extractNamedFunction('foodPosterMatchesMode'),
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
    extractNamedFunction('imageHasFailed'),
    extractNamedFunction('destinationRepresentationReady'),
    extractNamedFunction('destinationRepresentationFailed'),
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
      'generationsVideo',
      'painaVideo',
      'studioVideo',
      'ringVideo',
      'inkVideo',
      'generationsPoster',
      'painaPoster',
      'ranaPoster',
      'ringPoster',
      'prorokPortrait',
      'terminalReturn',
      'playSafe',
      'motionOn',
      'isMobile',
      readinessParts.join('\n') +
        '; return { videoHasRenderableFrame, mobileDestinationReady, mobileDestinationFailed, mobileReadinessStatus, applyMobileReadinessResult, requestMobileVideo, warmMobileBeatVideos, bindVideoReadiness, probeHiddenVideoFrame, resetVideoReadinessState };'
    )(
      generationsVideo,
      painaVideo,
      studioVideo,
      ringVideo,
      inkVideo,
      generationsPoster,
      painaPoster,
      ranaPoster,
      ringPoster,
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
        'a dormant hidden ring carrier still requires one proven frame before it is renderable'
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
    generationsVideo.readyState = 2;
    generationsVideo.error = null;
    painaVideo.readyState = 0;
    painaVideo.error = null;
    ringVideo.readyState = 0;
    ringVideo.error = null;
    inkVideo.readyState = 2;
    inkVideo.error = null;
    ok(mobileDestinationReady('generations'), 'Generations is ready from decoded motion or its matching poster');
    ok(mobileDestinationReady('paina'), 'Pā‘ina is immediately ready from its decoded time-zero match poster while video is cold');
    ok(mobileDestinationReady('rana'), 'Rana is immediately ready from its all-rings master or matching poster');
    ok(mobileDestinationReady('prorok'), 'ProRok is ready from the Healed montage or matching poster');
    ok(mobileDestinationReady('process'), 'process is ready only when its terminal image is loaded');
    terminalReturn.complete = false;
    ok(!mobileDestinationReady('process'), 'process cannot cut to an undecoded terminal image');
    terminalReturn.complete = true;
    prorokPortrait.complete = false;
    inkVideo.readyState = 0;
    ok(!mobileDestinationReady('prorok'), 'ProRok waits while both Healed representations are unavailable');
    inkVideo.readyState = 2;
    ok(mobileDestinationReady('prorok'), 'the decoded Healed montage is an authoritative ProRok representation');
    prorokPortrait.complete = true;
    ranaPoster.complete = false;
    studioVideo.requestVideoFrameCallback = function () {};
    studioVideo.jwSawDataEvent = true;
    delete studioVideo.jwDecodedFrame;
    ok(!mobileDestinationReady('rana'), 'Rana stays pending while the all-rings poster and presented frame are unavailable');
    studioVideo.jwDecodedFrame = true;
    ok(mobileDestinationReady('rana'), 'Rana becomes ready after the all-rings presented-frame callback');
    ranaPoster.complete = true;
    ok(mobileDestinationReady('rana'), 'Rana becomes ready when the all-rings poster is decoded');
    delete studioVideo.requestVideoFrameCallback;
    delete studioVideo.jwSawDataEvent;
    delete studioVideo.jwDecodedFrame;
    painaVideo.readyState = 2;
    ok(mobileDestinationReady('paina'), 'Pā‘ina becomes ready from its decoded portrait carrier');
    studioVideo.error = { code: 4 };
    ok(!mobileDestinationFailed('rana') && mobileDestinationReady('rana'), 'an all-rings media error falls back to its decoded poster');
    ranaPoster.naturalWidth = 0;
    ok(mobileDestinationFailed('rana') && !mobileDestinationReady('rana'), 'Rana fails when the approved still is unavailable');
    ranaPoster.naturalWidth = 498;
    studioVideo.error = null;

    generationsVideo.error = { code: 4 };
    ok(!mobileDestinationFailed('generations') && mobileDestinationReady('generations'), 'Generations video error advances through its decoded matching poster');
    generationsVideo.error = null;
    painaVideo.error = { code: 4 };
    ok(!mobileDestinationFailed('paina') && mobileDestinationReady('paina'), 'Pā‘ina video error advances through its decoded time-zero poster');
    painaVideo.error = null;
    inkVideo.error = { code: 4 };
    ok(!mobileDestinationFailed('prorok') && mobileDestinationReady('prorok'), 'Healed video error advances through its decoded poster');
    inkVideo.error = null;

    const coldStudio = { id: 'studio', readyState: 0, preload: 'metadata', loadCalls: 0, play() { this.played = true; } };
    coldStudio.load = function load() { this.loadCalls += 1; };
    requestMobileVideo(coldStudio, true);
    ok(
      coldStudio.preload === 'auto' && coldStudio.loadCalls === 0 && coldStudio.played === true,
      'requestMobileVideo lets play own the active carrier request without a duplicate load'
    );

    playCalls.length = 0;
    generationsVideo.readyState = 0;
    painaVideo.readyState = 0;
    studioVideo.readyState = 0;
    ringVideo.readyState = 0;
    inkVideo.readyState = 0;
    generationsVideo.load = function load() { loadCalls.push('generations'); };
    painaVideo.load = function load() { loadCalls.push('paina'); };
    studioVideo.load = function load() { loadCalls.push('studio'); };
    ringVideo.load = function load() { loadCalls.push('ring'); };
    inkVideo.load = function load() { loadCalls.push('ink'); };
    generationsVideo.play = function play() {};
    painaVideo.play = function play() {};
    studioVideo.play = function play() {};
    ringVideo.play = function play() {};
    inkVideo.play = function play() {};
    warmMobileBeatVideos();
    ok(
      playCalls.includes('generations') && !playCalls.includes('paina') &&
        !loadCalls.includes('generations') && !loadCalls.includes('paina') &&
        ['studio', 'ring', 'ink'].every((id) => !playCalls.includes(id) && !loadCalls.includes(id)),
      'cold-load warming requests and plays only Generations'
    );

    const restSnapshot = {
      scroll: 12,
      copyGenerations: 1,
      copyPaina: 0,
      copyRana: 0,
      copyProrok: 0,
      generationsHold: 1,
      painaOpen: 0,
      ranaOpen: 0,
      rest: 'generations',
    };
    const waitingScene = { ...restSnapshot };
    function startPassage() {
      waitingScene.scroll = 380;
      waitingScene.copyGenerations = 0;
      waitingScene.copyPaina = 1;
      waitingScene.generationsHold = 0;
      waitingScene.painaOpen = 1;
      waitingScene.rest = 'paina';
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
    ok(waitingScene.rest === 'paina', 'the visible clock starts only after readiness resolves');

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
        waitingScene.copyGenerations === restSnapshot.copyGenerations &&
        waitingScene.copyPaina === restSnapshot.copyPaina &&
        waitingScene.copyRana === restSnapshot.copyRana &&
        waitingScene.copyProrok === restSnapshot.copyProrok &&
        waitingScene.generationsHold === restSnapshot.generationsHold &&
        waitingScene.painaOpen === restSnapshot.painaOpen &&
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
    ok(waitingScene.rest === 'generations' && waitingScene.unlocked === true, 'timeout leaves the outgoing rest intact and unlocks navigation');

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
    ok(waitingScene.rest === 'generations', 'error does not advance to a poster or partial destination');

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
