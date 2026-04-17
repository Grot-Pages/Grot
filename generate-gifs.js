const puppeteer = require('puppeteer');
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

// GIF로 만들 페이지 (애니메이션 있음)
const GIF_PAGES = [
  {
    url: 'https://grot-pages.github.io/Grot/index-1',
    output: 'index-1.gif',
    width: 860,
    selector: '.banner'
  },
  {
    url: 'https://grot-pages.github.io/Grot/index-3',
    output: 'index-3.gif',
    width: 860,
    selector: '.notice'
  }
];

// PNG로 만들 페이지 (정적 이미지)
const PNG_PAGES = [
  {
    url: 'https://grot-pages.github.io/Grot/index-4',
    output: 'index-4.png',
    width: 860,
    selector: '.notice'
  }
];

// 애니메이션 캡처 설정
const FPS = 5;
const DURATION_SEC = 6;
const TOTAL_FRAMES = FPS * DURATION_SEC;
const FRAME_DELAY = Math.round(1000 / FPS);

async function generateGif(page, config) {
  console.log(`[GIF] Processing: ${config.url}`);

  await page.goto(config.url, { waitUntil: 'networkidle0', timeout: 30000 });

  const height = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.offsetHeight : 1080;
  }, config.selector);

  await page.setViewport({ width: config.width, height: height, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 2000));

  const encoder = new GIFEncoder(config.width, height);
  encoder.setDelay(FRAME_DELAY);
  encoder.setRepeat(0);
  encoder.setQuality(10);
  encoder.start();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: config.width, height: height },
      encoding: 'binary'
    });
    const png = PNG.sync.read(screenshot);
    encoder.addFrame(png.data);
    await new Promise(r => setTimeout(r, FRAME_DELAY));
  }

  encoder.finish();

  const outputPath = path.join(__dirname, config.output);
  fs.writeFileSync(outputPath, encoder.out.getData());
  console.log(`[GIF] Saved: ${config.output} (${height}px)`);
}

async function generatePng(page, config) {
  console.log(`[PNG] Processing: ${config.url}`);

  await page.goto(config.url, { waitUntil: 'networkidle0', timeout: 30000 });

  const height = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.offsetHeight : 800;
  }, config.selector);

  await page.setViewport({ width: config.width, height: height, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 2000));

  const outputPath = path.join(__dirname, config.output);
  await page.screenshot({
    path: outputPath,
    clip: { x: 0, y: 0, width: config.width, height: height }
  });
  console.log(`[PNG] Saved: ${config.output} (${height}px)`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  for (const config of GIF_PAGES) {
    await generateGif(page, config);
  }

  for (const config of PNG_PAGES) {
    await generatePng(page, config);
  }

  await browser.close();
  console.log('Done!');
})();
