import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright-core';
import { startPreviewServer } from './test-preview-server.mjs';

const evidence = process.env.JW_EVIDENCE_DIR || path.join(os.tmpdir(), 'jw-accessibility');
fs.mkdirSync(evidence, { recursive: true });
const preview = process.env.JW_TEST_URL ? null : await startPreviewServer(process.cwd());
const base = process.env.JW_TEST_URL || preview.url;
const browser = await chromium.launch({ executablePath: process.env.JW_EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const results = [];
async function test(name, work) {
  try { await work(); results.push({name, passed:true}); console.log('PASS',name); }
  catch(error) { results.push({name, passed:false, error:error.message}); console.error('FAIL',name,error.message); }
}

await test('Keyboard pause persists across reload and pages, then resumes', async () => {
  const context = await browser.newContext({ viewport:{width:1280,height:720} });
  const page = await context.newPage();
  await page.goto(base + '/');
  const pause = page.locator('.portfolio-header-tools .jw-pause-motion');
  await pause.waitFor();
  assert.equal(await pause.innerText(),'Pause motion');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(),'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'),'site-content');
  await pause.press('Enter');
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'off' && [...document.querySelectorAll('video')].every(v=>v.paused));
  assert.equal(await pause.innerText(),'Resume motion');
  assert.equal(await pause.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.motion),'off');
  await page.screenshot({path:path.join(evidence,'keyboard-paused.png')});
  await page.reload();
  assert.equal(await pause.innerText(),'Resume motion');
  assert.equal(await page.evaluate(()=>localStorage.getItem('jw-motion-choice-v1')),'off');
  await page.goto(base + '/work/paina-cafe/');
  const casePause = page.getByRole('button',{name:'Resume motion',exact:true});
  await casePause.waitFor();
  assert.equal(await page.locator('video').evaluateAll(vs=>vs.every(v=>v.paused)),true);
  await casePause.press('Enter');
  await page.getByRole('button',{name:'Pause motion',exact:true}).waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('video')].some(v=>!v.paused && v.currentTime>.1));
  await page.reload();
  assert.equal(await page.getByRole('button',{name:'Pause motion',exact:true}).count(),1);
  await context.close();
});

await test('Portfolio hides inactive scenes from assistive technology and keeps focused copy visible',async()=>{
  const context=await browser.newContext({viewport:{width:1280,height:720}});
  const page=await context.newPage();
  await page.goto(base+'/');
  await page.waitForFunction(()=>document.getElementById('portfolio-paina-video') && window.ROOT_PORTFOLIO_PASSAGE);
  assert.equal(await page.getByRole('main').count(),1);
  assert.equal(await page.getByRole('heading',{name:'Open the Pā‘ina Café website',exact:true}).count(),0);
  assert.equal(await page.locator('#portfolio-copy-paina').evaluate(el=>el.inert),true);
  const link=page.locator('#portfolio-copy-generations .portfolio-scene-name a');
  await link.waitFor({state:'visible'});
  await link.focus();
  assert.equal(await link.evaluate(el=>document.activeElement === el),true);
  await page.waitForFunction(()=>document.documentElement.classList.contains('portfolio-generations-human-beat'),undefined,{timeout:10000});
  assert.equal(await link.evaluate(el=>getComputedStyle(el.parentElement.parentElement).visibility),'visible');
  assert.equal(await link.evaluate(el=>Number(getComputedStyle(el.parentElement.parentElement).opacity)),1);
  await context.close();
});

await test('Proof buttons are exposed; dialog closes and restores keyboard focus',async()=>{
  const context=await browser.newContext({viewport:{width:1280,height:720}});
  const page=await context.newPage();
  await page.goto(base+'/?station=proof');
  const proof=page.locator('#process-console-screen');
  await proof.waitFor({state:'visible',timeout:15000});
  assert.equal(await proof.evaluate(el=>!!el.closest('[aria-hidden="true"],[inert]')),false);
  await proof.press('Enter');
  await page.getByRole('dialog').waitFor({state:'visible'});
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').evaluate(el=>!!el.closest('[role="dialog"]')),true);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(await page.locator(':focus').getAttribute('id'),'process-console-screen');
  await context.close();
});

for(const route of ['/','/work/','/work/generations-kitchen/','/work/paina-cafe/','/work/rana-levy/','/work/dylan-prorok/','/book/','/privacy/']) {
  await test('320px reflow '+route,async()=>{
    const context=await browser.newContext({viewport:{width:320,height:256}});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+route);
    await page.evaluate(()=>document.fonts.ready);
    if(route==='/'||route==='/work/') await page.waitForFunction(()=>document.documentElement.classList.contains('jw-readable'));
    const state=await page.evaluate(()=>{
      const h=[...document.querySelectorAll('h1')].find(e=>e.getClientRects().length);
      const box=h.getBoundingClientRect();
      return {width:document.documentElement.scrollWidth,viewport:innerWidth,headingTop:box.top,headingOverflow:h.scrollWidth>h.clientWidth+1};
    });
    assert.ok(state.width<=state.viewport+1,JSON.stringify(state));
    assert.ok(state.headingTop>=0 && !state.headingOverflow,JSON.stringify(state));
    if(route==='/'||route==='/work/') {
      const overflow=await page.locator('.no-js-stack').evaluate(stack=>[...stack.querySelectorAll('p,h1,h2,h3,li')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent.trim()));
      assert.deepEqual(overflow,[]);
    }
    assert.deepEqual(errors,[]);
    const name=route==='/'?'root':route.replaceAll('/','-');
    await page.screenshot({path:path.join(evidence,'reflow-'+name+'.png')});
    if(route==='/'||route==='/work/') {
      await page.setViewportSize({width:1280,height:720});
      await page.waitForFunction(()=>!document.documentElement.classList.contains('jw-readable'));
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.motion),'on');
    }
    await context.close();
  });
}

for(const route of ['/','/work/','/book/','/privacy/','/work/rana-levy/','/work/paina-cafe/']) {
  await test('200% text '+route,async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.goto(base+route);
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>{
      const sizes=[...document.querySelectorAll('body *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
      sizes.forEach(([el,size])=>{el.style.fontSize=size*2+'px';});
    });
    if(route==='/'||route==='/work/') await page.waitForFunction(()=>document.documentElement.classList.contains('jw-readable'));
    const state=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,headingTop:[...document.querySelectorAll('h1')].find(el=>el.getClientRects().length).getBoundingClientRect().top}));
    assert.ok(state.width<=state.viewport+1 && state.headingTop>=0,JSON.stringify(state));
    await page.screenshot({path:path.join(evidence,'text200-'+route.replaceAll('/','-')+'.png'),fullPage:true});
    await context.close();
  });
}

await test('Dylan status contrast exceeds 4.5:1',async()=>{
  const context=await browser.newContext();const page=await context.newPage();
  await page.goto(base+'/work/dylan-prorok/');
  const colors=await page.locator('.dylan-status .case-status').evaluate(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(el.closest('.dylan-status')).backgroundColor}));
  function luminance(rgb){return rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
  const a=luminance(colors.fg),b=luminance(colors.bg);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert.ok(ratio>=4.5,JSON.stringify({colors,ratio}));console.log('Dylan status contrast',ratio.toFixed(2));
  await context.close();
});

await browser.close();if(preview)await preview.close();
fs.writeFileSync(path.join(evidence,'accessibility-report.json'),JSON.stringify({base,generatedAt:new Date().toISOString(),results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
