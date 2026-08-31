#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
function ok(value, message) {
  if (value) console.log('OK', message);
  else failures.push(message);
}
function read(rel) {
  const full = path.join(ROOT, rel);
  ok(fs.existsSync(full), 'exists ' + rel);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

const routeFiles = {
  '/': 'index.html',
  '/work/': 'work/index.html',
  '/work/generations-kitchen/': 'work/generations-kitchen/index.html',
  '/work/paina-cafe/': 'work/paina-cafe/index.html',
  '/work/rana-levy/': 'work/rana-levy/index.html',
  '/work/dylan-prorok/': 'work/dylan-prorok/index.html',
};
const pages = Object.fromEntries(Object.entries(routeFiles).map(([route, rel]) => [route, read(rel)]));
const privacy = read('privacy/index.html');
const root = pages['/'];
const work = pages['/work/'];
const portfolioCss = read('assets/portfolio-root.css');
const portfolioJs = read('assets/portfolio-root.js');
const motionBootstrap = read('assets/motion-bootstrap.js');
const caseCss = read('assets/case-study.css');
const caseJs = read('assets/case-study.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');

for (const [route, html] of Object.entries(pages)) {
  const canonical = 'https://jarrettwroten.com' + route;
  ok(/<title>[^<]{20,}<\/title>/.test(html), route + ' has a descriptive title');
  ok(/<meta name="description" content="[^"]{60,}">/.test(html), route + ' has a descriptive meta description');
  ok(html.includes('<link rel="canonical" href="' + canonical + '">'), route + ' has a self canonical');
  ok(html.includes('property="og:title"') && html.includes('property="og:description"') && html.includes('property="og:url"') && html.includes('property="og:image"'), route + ' has complete Open Graph metadata');
  ok(html.includes('name="twitter:card"') && html.includes('name="twitter:title"') && html.includes('name="twitter:description"') && html.includes('name="twitter:image"'), route + ' has complete Twitter metadata');
  ok(!/name="robots"[^>]*noindex/i.test(html), route + ' remains indexable');
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  ok(jsonLd.length >= 1, route + ' has JSON-LD');
  for (const match of jsonLd) {
    try { JSON.parse(match[1]); ok(true, route + ' JSON-LD parses'); }
    catch (error) { failures.push(route + ' JSON-LD parse: ' + error.message); }
  }
}

ok(/name="robots" content="noindex,follow"/.test(privacy), 'privacy is noindex,follow');
ok(privacy.includes('<link rel="canonical" href="https://jarrettwroten.com/privacy/">'), 'privacy has a self canonical');
ok(!sitemap.includes('/privacy/'), 'privacy is omitted from sitemap');
ok(!fs.existsSync(path.join(ROOT, 'las-vegas-web-design')), 'unapproved Las Vegas landing route remains absent');

const expectedIndex = Object.keys(routeFiles).map((route) => 'https://jarrettwroten.com' + route);
const actualIndex = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
ok(JSON.stringify(actualIndex) === JSON.stringify(expectedIndex), 'sitemap contains the exact six-URL index set');
ok(/User-agent:\s*\*[\s\S]*Allow:\s*\/[\s\S]*Sitemap:\s*https:\/\/jarrettwroten\.com\/sitemap\.xml/.test(robots), 'robots allows crawling and names the sitemap');
ok(!/Disallow:\s*\/(?:privacy|work)/i.test(robots), 'robots does not block pages that depend on HTML index directives');

for (const rel of [
  'index-photo-preview.html',
  'jarrettwroten-site/index-photo-preview.html',
  'demos/mobile-method-oracle-preview.html',
  'demos/mobile-method-oracle.html',
  'demos/dylan-prorok/index.html',
]) {
  ok(!fs.existsSync(path.join(ROOT, rel)), 'retired HTML route is absent: ' + rel);
}
ok(fs.existsSync(path.join(ROOT, 'demos/dylan-prorok/healed-montage-desktop-854d3384.mp4')), 'Dylan desktop Healed carrier remains available');
ok(fs.existsSync(path.join(ROOT, 'demos/dylan-prorok/healed-montage-mobile-18bdbd22.mp4')), 'Dylan mobile Healed carrier remains available');

const allRuntime = [...Object.values(pages), privacy].join('\n');
ok(!/<form\b/i.test(allRuntime), 'runtime adds no contact form');
ok(!/googletagmanager|google-analytics|\bgtag\s*\(|GTM-|generate_lead/i.test(allRuntime), 'runtime adds no analytics or lead event code');
ok(!/\bCRM\b/i.test(allRuntime), 'runtime makes no CRM claim');
ok(root.includes('mailto:Jarrett@JarrettWroten.com') && root.includes('https://calendar.app.google/'), 'contact remains email plus Google Calendar');
ok(
  /class="portfolio-terminal-book"[\s\S]*?Want a free concept for your site\?[\s\S]*?at least 24 hours ahead[\s\S]*?current website[\s\S]*?portfolio-terminal-book-action/.test(root) &&
    /class="terminal-book"[\s\S]*?Want a free concept for your site\?[\s\S]*?at least 24 hours ahead[\s\S]*?current website[\s\S]*?terminal-book-action/.test(work),
  'root and Work add the free-concept booking path inside the existing terminal rest'
);
ok(root.includes('href="privacy/"'), 'root final footer links quietly to privacy');

const caseRequirements = [
  ['/work/generations-kitchen/', 'Restaurant Concept', 'gk-runway'],
  ['/work/paina-cafe/', 'Restaurant Concept', 'paina-gather'],
  ['/work/rana-levy/', 'Pending Engagement', 'rana-path-grid'],
  ['/work/dylan-prorok/', 'Tattoo Artist - In Progress', 'dylan-principle-list'],
];
for (const [route, status, signature] of caseRequirements) {
  const html = pages[route];
  ok(html.includes(status), route + ' shows exact relationship status');
  ok(html.includes(signature), route + ' has its project-specific content structure');
  ok(
    !/<button[^>]*case-motion-toggle/.test(html) &&
      html.includes('/assets/motion-bootstrap.js') &&
      html.includes('/assets/case-study.js'),
    route + ' defaults through the shared motion owner without a visible toggle'
  );
  ok(!html.includes('What this status means'), route + ' avoids repeated legal-template ending');
  ok(!/created by Jarrett Wroten/i.test(html), route + ' speaks in Jarrett first person');
  ok(!/image000001|image0000002|stripe-growth/i.test(html), route + ' does not inherit unrelated process proof');
}
ok(!/border-radius\s*:\s*50%/.test(pages['/work/rana-levy/']), 'Rana material passage has no circular vitrine crop');
ok(/\.rana-gem video\{[^}]*width:100%;[^}]*height:100%;[^}]*object-fit:contain/.test(pages['/work/rana-levy/']), 'Rana material carrier stays full and uncropped');
ok(pages['/work/rana-levy/'].includes('rana-hero-still') && pages['/work/dylan-prorok/'].includes('dylan-mobile-portrait'), 'Rana and Dylan mobile heroes have intentional uncropped still compositions');
ok(/\.gk-status \.case-action\{color:#2d1608/.test(pages['/work/generations-kitchen/']), 'Generations light ending keeps its action readable');
ok(/style="position:absolute;overflow:hidden"/.test(pages['/work/dylan-prorok/']), 'Dylan SVG filter cannot create a layout strip');
ok(/\.dylan-principle\{[^}]*grid-template-columns:max-content minmax\(0,1fr\)/.test(pages['/work/dylan-prorok/']) && /\.dylan-principle h3\{[^}]*clamp\(2\.3rem,4vw,4\.25rem\)/.test(pages['/work/dylan-prorok/']), 'Dylan desktop principle grid reserves intrinsic heading width with bounded type');
ok(!/font-style:italic/.test(pages['/work/paina-cafe/']), 'Pā‘ina does not synthesize an unloaded italic display face');

ok(caseCss.includes('font:600 .875rem/1.2 var(--case-ui)') && caseCss.includes('font:600 .875rem/1.3 var(--case-ui)') && caseCss.includes('font:500 .875rem/1.4 var(--case-ui)'), 'case labels and footer meet the 14px authored floor');
ok(caseCss.includes('html[data-case-motion="off"] video{visibility:hidden}'), 'motion-off reveals authored poster fields instead of moving video');
ok(caseJs.includes('jw-motion-change') && caseJs.includes('videos[i].pause()'), 'case motion consumer follows the shared reduced-motion state and pauses every carrier');
try { new Function(caseJs); ok(true, 'case motion controller parses'); }
catch (error) { failures.push('case motion controller parse: ' + error.message); }
try { new Function(portfolioJs); ok(true, 'root portfolio controller parses'); }
catch (error) { failures.push('root portfolio controller parse: ' + error.message); }

const portfolioBlock = (root.match(/<!-- The approved \/work\/[\s\S]*?<script src="assets\/portfolio-root\.js(?:\?[^\"]+)?"><\/script>/) || [''])[0];
const portfolioClasses = [...portfolioBlock.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
ok(portfolioClasses.length > 20 && portfolioClasses.every((name) => name.startsWith('portfolio-')), 'homepage portfolio markup contains only namespaced classes');
ok([...new Set(portfolioClasses)].every((name) => portfolioCss.includes('.' + name)), 'every homepage portfolio class has a matching style selector');
const ids = [...root.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
ok(ids.length === new Set(ids).size, 'combined root has no duplicate IDs');
ok(/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(root) && !/<meta name="process-viewport"/.test(root), 'combined root keeps the standard viewport meta');
ok(root.indexOf('id="portfolio-passage"') < root.indexOf('id="process-journey"'), 'root visitor reaches portfolio before process');
ok(portfolioJs.includes('portfolioOwnsViewport()') && root.includes('journeyOwnsViewport()'), 'portfolio and process inputs are passage-owned');
ok(
  portfolioJs.includes('addEventListener("jw-motion-change"') &&
    root.includes('addEventListener("jw-motion-change"') &&
    caseJs.includes('addEventListener("jw-motion-change"') &&
    motionBootstrap.includes('prefers-reduced-motion: reduce'),
  'portfolio, Process, and case studies consume one deterministic motion owner'
);
ok(root.includes('watchForProcessActivation') && /id="process-arrival-motion-video"[\s\S]*?preload="none"/.test(root), 'process media boot stays deferred on portfolio cold load');
ok(root.includes('one result from the process') && work.includes('one result from the process') && !/result behind the work/.test(root + work), 'anonymous process proof is separated from the named concepts');

ok(privacy.includes('I use what you send to respond, prepare, set the time, and follow up.'), 'privacy states how contact and booking data is used');
ok(privacy.includes('Google handles that data in its own service.'), 'privacy states Google Calendar handling');
ok(privacy.includes('only as long as I need it') && privacy.includes('normal business records'), 'privacy states a bounded retention purpose');
ok(privacy.includes('fix or delete your information') && privacy.includes('Jarrett@JarrettWroten.com'), 'privacy gives correction and deletion contact');
ok(privacy.includes('Do not send sensitive information'), 'privacy warns against sensitive information');
ok(privacy.includes('does not use analytics or tracking now') && privacy.includes('before I turn either one on'), 'privacy states current measurement is off and promises notice first');
ok(!privacy.includes('—') && !/your privacy matters/i.test(privacy), 'privacy has no em dash or canned privacy opener');

ok(!root.includes('The food already makes the sale') && !work.includes('The food already makes the sale'), 'unsupported Generations sales line is absent');
ok(!/live Rana site|I built the site around the hand/.test(root + work), 'Rana stays inside the pending concept boundary');
ok(!/currently being revised (?:with|by) Dylan Prorok/.test(root + work), 'Dylan copy makes no unsupported collaboration claim');

ok(
  root.includes('<script src="assets/motion-bootstrap.js"></script>') &&
    work.includes('<script src="../assets/motion-bootstrap.js"></script>') &&
    caseRequirements.every(([route]) => pages[route].includes('<script src="/assets/motion-bootstrap.js"></script>')),
  'root, Work, and every case study load one shared synchronous motion bootstrap'
);
ok(
  motionBootstrap.includes('query || (media.matches ? "off" : "on")') &&
    motionBootstrap.includes('if (explicit) return;') &&
    motionBootstrap.includes('localStorage.removeItem("jw-motion")') &&
    !motionBootstrap.includes('localStorage.setItem('),
  'motion bootstrap defaults on, honors query and OS reduction, and retires stored toggle state'
);
ok(
  !/<button[^>]*(?:portfolio-motion-toggle|process-motion-toggle|class="motion-toggle"|case-motion-toggle)/.test(
    root + work + caseRequirements.map(([route]) => pages[route]).join('\n')
  ),
  'no outward route renders a Motion On or Off button'
);
ok(
  root.includes('loco-moco-natural-desktop-dc59bdf1.mp4') &&
    root.includes('loco-moco-natural-mobile-fc141d42.mp4') &&
    work.includes('loco-moco-natural-desktop-dc59bdf1.mp4') &&
    work.includes('loco-moco-natural-mobile-fc141d42.mp4') &&
    root.includes('generations-kitchen-logo-03eee381.png') &&
    work.includes('generations-kitchen-logo-03eee381.png'),
  'root and Work use the uninterrupted full-bleed Loco Moco scene with its real brand mark'
);
ok(
  !portfolioCss.includes('.portfolio-generations-wash') &&
    !portfolioCss.includes('filter:saturate(1.04) contrast(1.04)') &&
    !root.includes('class="portfolio-generations-wash"') &&
    !work.includes('class="generations-wash"') &&
    !/function drawMobileGenerationsScene\(ctx, sourceOverride\) \{[^}]*ctx\.filter/.test(portfolioJs),
  'Generations renders without the portfolio-added grade, wash, or mobile canvas filter'
);
ok(
  portfolioCss.includes('html.portfolio-generations-human-beat .portfolio-scene-copy--generations') &&
    portfolioJs.includes('t >= 0 && t < 0.5') &&
    portfolioJs.includes('portfolio-generations-human-beat') &&
    work.includes('html.generations-human-beat .scene-copy--generations') &&
    work.includes('root.classList.toggle("generations-human-beat", active)'),
  'duplicate portfolio copy yields only while the natural source contains the woman'
);
ok((work.match(/href="\.\.\/#process-journey"/g) || []).length === 2, 'scripted and no-JS Work terminal actions target homepage Process Arrival');
ok(portfolioJs.includes('function glideToProcessArrival()') && portfolioJs.includes('current === MOBILE_STOPS.length - 1'), 'homepage mobile terminal has an explicit forward Process boundary');
ok(root.includes('direction < 0 && current === 0 && window.ROOT_PORTFOLIO_PASSAGE'), 'Process Arrival has an explicit reverse portfolio boundary');

ok(
  /\.portfolio-generations-poster,[\s\S]*?\.portfolio-generations-video\{[\s\S]*?object-fit:cover/.test(portfolioCss) &&
    /\.portfolio-paina-poster,[\s\S]*?\.portfolio-paina-video\{[\s\S]*?object-fit:cover/.test(portfolioCss) &&
    /\.generations-poster,[\s\S]*?\.generations-video\{[\s\S]*?object-fit:cover/.test(work) &&
    /\.paina-poster,[\s\S]*?\.paina-video\{[\s\S]*?object-fit:cover/.test(work),
  'Generations and Pā‘ina give the viewport edge-to-edge frame authority'
);
ok(
  /function drawMobileGenerationsScene\(ctx, sourceOverride\)[\s\S]*?return drawMobileCover\(ctx, source\)/.test(portfolioJs) &&
    /function drawMobilePainaScene\(ctx, sourceOverride\)[\s\S]*?drawMobileCover\(ctx, source\)/.test(portfolioJs) &&
    /function drawMobileRanaScene\(ctx\)[\s\S]*?drawMobileCover\(ctx, source\)/.test(portfolioJs) &&
    /function drawMobileProrokScene\(ctx\)[\s\S]*?drawMobileHealedDisplay\(ctx, source\)/.test(portfolioJs),
  'mobile uses full-bleed cover for Generations, Pā‘ina, and Rana while preserving the complete Healed display'
);
ok(
  portfolioJs.includes('function drawMobileContain(ctx, source)') &&
    portfolioJs.includes('Math.min(mobilePlateWidth / size.width, mobilePlateHeight / size.height)') &&
    work.includes('function drawMobileContain(ctx, source)') &&
    !portfolioJs.includes('mobilePlateCtx.scale(') &&
    !work.includes('mobilePlateCtx.scale('),
  'root and Work retain the centered contain helper for source-authoritative terminal media'
);
ok(
  root.includes('all-rings-desktop-45b16c5d.mp4') &&
    root.includes('alexandrite-desktop-cedccbe9.mp4') &&
    portfolioJs.includes('studioVideo.addEventListener("ended"') &&
    portfolioJs.includes('setRanaSequenceSecondary(true)') &&
    root.includes('healed-montage-desktop-854d3384.mp4') &&
    root.includes('healed-montage-mobile-18bdbd22.mp4'),
  'Rana sequences all rings before Alexandrite and Dylan uses the exact responsive Healed montage'
);
ok(
  !/\.portfolio-rana-ring-stage\{[^}]*width:min\(/.test(portfolioCss) &&
    !/\.portfolio-rana-ring-stage\{[^}]*mix-blend-mode:screen/.test(portfolioCss) &&
    /\.portfolio-rana-ring-stage\{[^}]*inset:0[^}]*width:100%[^}]*height:100%/.test(portfolioCss),
  'Rana has no translucent boxed ring overlay; Alexandrite replaces the full frame'
);
ok(
  /id="portfolio-paina-video"[\s\S]*?preload="none"/.test(root) &&
    /id="portfolio-rana-studio-video"[\s\S]*?preload="none"/.test(root) &&
    /id="portfolio-prorok-ink-video"[\s\S]*?preload="none"/.test(root) &&
    /function warmMobileBeatVideos\(\)[\s\S]*?requestMobileVideo\(generationsVideo, true\)[\s\S]*?\}/.test(portfolioJs) &&
    !/function warmMobileBeatVideos\(\)[\s\S]*?requestMobileVideo\(painaVideo/.test(portfolioJs),
  'cold Generations defers downstream project videos until destination readiness requests them'
);

const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const previewServer = read('test-preview-server.mjs');
ok(packageJson.devDependencies?.['playwright-core'] === '1.62.1' && packageLock.packages?.['node_modules/playwright-core']?.version === '1.62.1', 'browser harness pins playwright-core 1.62.1 in manifest and lockfile');
ok(previewServer.includes('Accept-Ranges') && previewServer.includes('Content-Range') && previewServer.includes("server.listen(0, '127.0.0.1'"), 'browser harness owns an ephemeral Range-capable preview server');
ok(browserTestUsesPortableDefaults(), 'browser harness discovers Edge and defaults evidence to the OS temp directory');
function browserTestUsesPortableDefaults() {
  const source = read('browser-release-test.mjs');
  return source.includes("path.join(os.tmpdir()") && source.includes('function findEdge()') && source.includes('startPreviewServer(ROOT)') && !source.includes('C:/Users/jman6');
}

const maintenance = read('PORTFOLIO-MAINTENANCE.md');
ok(maintenance.includes('Consolidating them during the launch correction') && maintenance.includes('deferred'), 'duplicated engine debt is explicit instead of silently drifting');
function normalizedMap(source, name, ending) {
  const match = source.match(new RegExp('var ' + name + ' = [\\s\\S]*?' + ending));
  return match ? match[0].replace(/\s+/g, ' ') : '';
}
for (const [name, ending] of [['INTRO', '\\};'], ['MAP', '\\};'], ['STILL', '\\};'], ['MOBILE_STOPS', '\\];']]) {
  ok(normalizedMap(portfolioJs, name, ending) === normalizedMap(work, name, ending), 'root and Work retain parity for ' + name);
}

if (failures.length) {
  console.error('\nFAIL ' + failures.length);
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log('\nRELEASE CANDIDATE STRUCTURAL PASS');
