const puppeteer = require('puppeteer');
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');
const GIF_PAGES = [
  { url: 'https://grot-pages.github.io/Grot/nasal-event', output: 'nasal-event.gif', width: 860, selector: '.banner' },
  { url: 'https://grot-pages.github.io/Grot/elderberry-event', output: 'elderberry-event.gif', width: 848, selector: '.banner' },
  { url: 'https://grot-pages.github.io/Grot/index-1', output: 'index-1.gif', width: 860, selector: '.banner' },
  { url: 'https://grot-pages.github.io/Grot/index-3', output: 'index-3.gif', width: 860, selector: '.notice' }
];
const PNG_PAGES = [
  { url: 'https://grot-pages.github.io/Grot/index-4', output: 'index-4.png', width: 600, selector: '.notice' }
];
const FPS=5,DURATION_SEC=6,TOTAL_FRAMES=FPS*DURATION_SEC,FRAME_DELAY=Math.round(1000/FPS);
async function generateGif(page,c){console.log('[GIF] Processing: '+c.url);await page.goto(c.url,{waitUntil:'networkidle0',timeout:30000});const h=await page.evaluate(s=>{const e=document.querySelector(s);return e?e.offsetHeight:1080},c.selector);await page.setViewport({width:c.width,height:h,deviceScaleFactor:1});await new Promise(r=>setTimeout(r,2000));const enc=new GIFEncoder(c.width,h);enc.setDelay(FRAME_DELAY);enc.setRepeat(0);enc.setQuality(10);enc.start();for(let i=0;i<TOTAL_FRAMES;i++){const shot=await page.screenshot({clip:{x:0,y:0,width:c.width,height:h},encoding:'binary'});enc.addFrame(PNG.sync.read(shot).data);await new Promise(r=>setTimeout(r,FRAME_DELAY))}enc.finish();fs.writeFileSync(path.join(__dirname,c.output),enc.out.getData());console.log('[GIF] Saved: '+c.output+' ('+h+'px)')}
async function generatePng(page,c){await page.goto(c.url,{waitUntil:'networkidle0',timeout:30000});const h=await page.evaluate(s=>{const e=document.querySelector(s);return e?e.offsetHeight:800},c.selector);await page.setViewport({width:c.width,height:h,deviceScaleFactor:2});await new Promise(r=>setTimeout(r,2000));await page.screenshot({path:path.join(__dirname,c.output),clip:{x:0,y:0,width:c.width,height:h}})}
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});const p=await b.newPage();for(const c of GIF_PAGES)await generateGif(p,c);for(const c of PNG_PAGES)await generatePng(p,c);await b.close();console.log('Done!')})();
