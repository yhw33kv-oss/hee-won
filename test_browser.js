const puppeteer = require('C:/Users/User/AppData/Roaming/npm/node_modules/puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log("Starting Browser Test...");
  const server = http.createServer((req, res) => {
    let filePath = path.join('D:/새 폴더/AI_PROJECTS/HEE_WON', req.url === '/' ? 'index.html' : req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200);
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(8083);

  const browser = await puppeteer.launch({ headless: 'new' });
  let consoleErrors = [];

  async function newPage() {
    const page = await browser.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => { consoleErrors.push(err.toString()); });
    page.on('dialog', async dialog => { console.log('ALERT:', dialog.message()); await dialog.accept(); });
    return page;
  }

  // 1. CASE_HOME_ORDER
  try {
    const p = await newPage();
    await p.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });

    const html = await p.evaluate(() => document.getElementById('page-main').innerHTML);
    const brandIndex = html.indexOf('<h2>당신의 이야기를');
    const freeMenuIndex = html.indexOf('class="menu"');
    const premiumIndex = html.indexOf('운담재 PREMIUM');
    const shareIndex = html.indexOf('친구에게 공유하기');

    if (brandIndex < freeMenuIndex && freeMenuIndex < premiumIndex && premiumIndex < shareIndex) {
      console.log("CASE_HOME_ORDER: PASS");
    } else {
      console.log("CASE_HOME_ORDER: FAIL", {brandIndex, freeMenuIndex, premiumIndex, shareIndex});
    }
    await p.close();
  } catch(e) { console.log("CASE_HOME_ORDER: FAIL", e.message); }

  // 2. CASE_PREMIUM_NEW_USER
  try {
    const p = await newPage();
    await p.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });
    
    // Premium 분석 보기 (HOME)
    await p.evaluate(() => navigate('#premium-preview'));
    await p.waitForSelector('#page-premium-preview.active');

    // 내 Premium 분석 시작하기
    await p.evaluate(() => startPremiumOnboarding());
    await p.waitForSelector('#page-premium-input.active');

    // Verify fields exist
    const hasFields = await p.evaluate(() => {
      return document.querySelector('#premium-name') !== null &&
             document.querySelector('input[name="premium-gender"]') !== null &&
             document.querySelector('#premium-date') !== null &&
             document.querySelector('input[name="premium-cal"]') !== null &&
             document.querySelector('#premium-time') !== null;
    });
    if (!hasFields) throw new Error("Missing input fields in #premium-input");

    // Fill data
    await p.evaluate(() => {
      document.querySelector('#premium-name').value = 'Test';
      document.querySelector('input[name="premium-gender"][value="m"]').checked = true;
      document.querySelector('#premium-date').value = '1990-03-15';
      document.querySelector('#premium-time').value = '12:00';
    });

    // Submit
    await p.evaluate(() => submitPremium());
    await new Promise(r => setTimeout(r, 500));
    
    const isPremium = await p.evaluate(() => document.querySelector('#page-premium-report').classList.contains('active'));
    if (isPremium) console.log("CASE_PREMIUM_NEW_USER: PASS");
    else console.log("CASE_PREMIUM_NEW_USER: FAIL (Did not navigate to report)");
    
    await p.close();
  } catch(e) { console.log("CASE_PREMIUM_NEW_USER: FAIL", e.message); }

  // 3. CASE_PREMIUM_EXISTING_USER
  try {
    const p = await newPage();
    await p.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });
    
    // Fill data in free saju to simulate existing data
    await p.evaluate(() => navigate('#saju-input'));
    await p.evaluate(() => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="m"]').checked = true;
      document.querySelector('#saju-date').value = '2000-01-01';
      document.querySelector('#saju-time').value = '12:00';
    });
    await p.evaluate(() => submitSaju());
    await new Promise(r => setTimeout(r, 500));

    // Go home
    await p.evaluate(() => navigate('#main'));
    await p.waitForSelector('#page-main.active');

    // Go Premium
    await p.evaluate(() => navigate('#premium-preview'));
    await p.waitForSelector('#page-premium-preview.active');

    // Click CTA -> should go to report directly
    await p.evaluate(() => startPremiumOnboarding());
    await new Promise(r => setTimeout(r, 500));

    const isPremium = await p.evaluate(() => document.querySelector('#page-premium-report').classList.contains('active'));
    if (isPremium) console.log("CASE_PREMIUM_EXISTING_USER: PASS");
    else console.log("CASE_PREMIUM_EXISTING_USER: FAIL");
    
    await p.close();
  } catch(e) { console.log("CASE_PREMIUM_EXISTING_USER: FAIL", e.message); }

  // 4. CASE_FREE_SAJU
  try {
    const p = await newPage();
    await p.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });
    await p.evaluate(() => navigate('#saju-input'));
    await p.evaluate(() => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="m"]').checked = true;
      document.querySelector('#saju-date').value = '2000-01-01';
      document.querySelector('#saju-time').value = '12:00';
    });
    await p.evaluate(() => submitSaju());
    await new Promise(r => setTimeout(r, 500));

    const html = await p.evaluate(() => document.querySelector('#page-saju-result').innerHTML);

    const hasCTA = html.includes('Premium 보기');
    const hasDashboard = html.includes('주목할 전성기 후보') || html.includes('id="premium-candidates-container"');

    if (hasCTA && !hasDashboard) console.log("CASE_FREE_SAJU: PASS");
    else console.log("CASE_FREE_SAJU: FAIL", {hasCTA, hasDashboard});
    await p.close();
  } catch(e) { console.log("CASE_FREE_SAJU: FAIL", e.message); }

  // 5. CASE_TODAY_FORTUNE
  try {
    const p = await newPage();
    await p.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });
    
    await p.evaluate(() => navigate('#saju-input'));
    await p.evaluate(() => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="m"]').checked = true;
      document.querySelector('#saju-date').value = '2000-01-01';
      document.querySelector('#saju-time').value = '12:00';
    });
    await p.evaluate(() => submitSaju());
    await new Promise(r => setTimeout(r, 500));
    
    await p.evaluate(() => navigate('#main'));
    await new Promise(r => setTimeout(r, 200));

    await p.evaluate(() => navigate('#fortune-input'));
    await new Promise(r => setTimeout(r, 500));

    const isFortune = await p.evaluate(() => document.querySelector('#page-fortune-result').classList.contains('active'));
    if (isFortune) console.log("CASE_TODAY_FORTUNE: PASS");
    else console.log("CASE_TODAY_FORTUNE: FAIL");
    await p.close();
  } catch(e) {
    console.log("CASE_TODAY_FORTUNE: FAIL", e.message);
  }

  console.log("CONSOLE_ERRORS:");
  if (consoleErrors.length > 0) {
    const filtered = consoleErrors.filter(e => !e.includes('favicon.ico') && !e.includes('404'));
    if (filtered.length > 0) {
      filtered.forEach(e => console.log(e));
    } else {
      console.log("NONE");
    }
  } else {
    console.log("NONE");
  }

  await browser.close();
  server.close();
})();
