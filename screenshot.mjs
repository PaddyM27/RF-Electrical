import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'temporary screenshots');

const require = createRequire('/tmp/pup/node_modules/puppeteer/');
const puppeteer = require('puppeteer');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

async function getNextNumber() {
  if (!existsSync(screenshotDir)) return 1;
  const files = await readdir(screenshotDir);
  const nums = files
    .map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1]))
    .filter(Boolean);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

async function main() {
  if (!existsSync(screenshotDir)) {
    await mkdir(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Users/paddymeade/.cache/puppeteer/chrome/mac_arm-145.0.7632.77/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Force all scroll-reveal elements visible for full-page screenshot
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });
  // Wait for fonts, animations and transitions to settle
  await new Promise(r => setTimeout(r, 1800));

  const n = await getNextNumber();
  const suffix = label ? `-${label}` : '';
  const filename = `screenshot-${n}${suffix}.png`;
  const filepath = join(screenshotDir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  await browser.close();

  console.log(`Saved: temporary screenshots/${filename}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
