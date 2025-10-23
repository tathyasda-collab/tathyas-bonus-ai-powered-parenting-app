const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const providedBase = process.env.TEST_BASE_URL;
  const base = providedBase || 'http://localhost:5000';
  let serverProcess = null;

  // If no base provided, spawn local server
  if (!providedBase) {
    serverProcess = spawn(process.execPath, [path.join(__dirname, 'serve-dist.cjs')], { stdio: 'ignore', detached: true });
    serverProcess.unref();

    // wait for server to be ready
    const waitForServer = () => new Promise((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const check = () => {
        http.get(base, res => { res.destroy(); resolve(); }).on('error', () => {
          if (Date.now() > deadline) return reject(new Error('Server did not start in time'));
          setTimeout(check, 200);
        });
      };
      check();
    });

    try {
      await waitForServer();
    } catch (e) {
      console.error('Failed to start server:', e.message);
    }
  }
  const outDir = path.resolve(__dirname, '..', 'test-artifacts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const logs = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[pageerror] ${err.message}\n${err.stack}`));

  try {
    await page.goto(base, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    logs.push(`[navigation error] ${e.message}`);
  }

  // wait a bit for client JS to initialize
  await page.waitForTimeout(1500);

  // If credentials provided via env, perform login to capture authenticated UI
  const testEmail = process.env.TEST_EMAIL;
  const testPassword = process.env.TEST_PASSWORD;
  if (testEmail && testPassword) {
    try {
      // Fill login form (ids used in LoginPage: email, password)
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
      ]);

      // Wait for dashboard header or user-specific element
      await page.waitForTimeout(1000);
      logs.push('[info] Attempted sign-in with TEST_EMAIL');
    } catch (e) {
      logs.push(`[login error] ${e.message}`);
    }
  }

  // Try opening the Planner and Meal Assistant tools (click the "Open Tool" buttons)
  try {
    // Planner
    const plannerBtn = await page.$("xpath=//h3[contains(., 'Parenting Planner')]/ancestor::div[1]//button[contains(., 'Open Tool')]");
    if (plannerBtn) {
      await plannerBtn.click().catch(() => {});
      await page.waitForTimeout(1200);
      logs.push('[info] Clicked Parenting Planner open button');
    } else {
      logs.push('[info] Parenting Planner button not found');
    }

    // Meal Assistant
    const mealBtn = await page.$("xpath=//h3[contains(., 'Meal Assistant')]/ancestor::div[1]//button[contains(., 'Open Tool')]");
    if (mealBtn) {
      await mealBtn.click().catch(() => {});
      await page.waitForTimeout(1200);
      logs.push('[info] Clicked Meal Assistant open button');
    } else {
      logs.push('[info] Meal Assistant button not found');
    }
  } catch (e) {
    logs.push(`[tool click error] ${e.message}`);
  }

  const screenshotPath = path.join(outDir, 'prod-screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(e => logs.push('[screenshot error] ' + e.message));

  const html = await page.content();
  fs.writeFileSync(path.join(outDir, 'prod-dom.html'), html, 'utf8');
  fs.writeFileSync(path.join(outDir, 'console.log'), logs.join('\n'), 'utf8');

  console.log('Artifacts written to', outDir);

  await browser.close();
  if (serverProcess) {
    try { process.kill(-serverProcess.pid); } catch (_) {}
  }
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
