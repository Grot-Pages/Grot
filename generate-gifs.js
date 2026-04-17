const puppeteer = require('puppeteer');
const GIFEncoder = require('gif-encoder-2');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

// 설정
const PAGES = [
  {
    url: 'https://grot-pages.github.io/Grot/index-1',
    output: 'index-1.gif',
    width: 860,
    height: null, // 자동 감지
    selector: '.banner'
  },
  {
    url: 'https://grot-pages.github.io/Grot/index-3',
    output: 'index-3.gif',
    width: 860,
    height: null,
    selector: '.notice'
  }
];

// 애니메이션 캡처 설정
const FPS = 5;                    // 초당 프레임
const DURATION_SEC = 6;           // 전체 애니메이션 주기 (6초)
const TOTAL_FRAMES = FPS * DURATION_SEC; // 30프레임
const FRAME_DELAY = Math.round(1000 / FPS); // 200ms

async function generateGif(page, config) {
  console.log(`Processing: ${config.url}`);

  // 페이지 열기
  await page.goto(config.url, { waitUntil: 'networkidle0', timeout: 30000 });

  // 요소 높이 자동 감지
  const height = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.offsetHeight : 1080;
  }, config.selector);

  await page.setViewport({ width: config.width, height: height, deviceScaleFactor: 1 });

  // 잠시 대기 (폰트 로딩)
  await new Promise(r => setTimeout(r, 2000));

  // GIF 인코더 생성
  const encoder = new GIFEncoder(config.width, height);
  encoder.setDelay(FRAME_DELAY);
  encoder.setRepeat(0); // 무한 반복
  encoder.setQuality(10);
  encoder.start();

  // 프레임 캡처
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: config.width, height: height },
      encoding: 'binary'
    });

    const png = PNG.sync.read(screenshot);
    encoder.addFrame(png.data);

    // 다음 프레임까지 대기
    await new Promise(r => setTimeout(r, FRAME_DELAY));
  }

  encoder.finish();

  // GIF 저장
  const outputPath = path.join(__dirname, config.output);
  fs.writeFileSync(outputPath, encoder.out.getData());
  console.log(`Saved: ${outputPath} (${height}px height, ${TOTAL_FRAMES} frames)`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  for (const config of PAGES) {
    await generateGif(page, config);
  }

  await browser.close();
  console.log('Done!');
})();
