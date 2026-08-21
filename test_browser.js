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
    page.on('dialog', async dialog => { await dialog.accept(); });
    return page;
  }

  // 1. CASE_HOME_PREMIUM_PREVIEW
  try {
    const p1 = await newPage();
    await p1.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });

    const hasPremiumCard = await p1.evaluate(() => document.body.innerHTML.includes('운담재 PREMIUM'));
    if (!hasPremiumCard) throw new Error("No Premium Card on HOME");

    await p1.evaluate(() => navigate('#premium-preview'));
    await p1.waitForSelector('#page-premium-preview.active');

    const hasCTA = await p1.evaluate(() => document.body.innerHTML.includes('내 Premium 분석 시작하기'));
    if (hasCTA) console.log("CASE_HOME_PREMIUM_PREVIEW: PASS");
    else console.log("CASE_HOME_PREMIUM_PREVIEW: FAIL (No CTA)");
    await p1.close();
  } catch(e) { console.log("CASE_HOME_PREMIUM_PREVIEW: FAIL", e.message); }

  // 2. CASE_PREMIUM_START
  try {
    const p2 = await newPage();
    await p2.goto('http://localhost:8083/#premium-preview', { waitUntil: 'networkidle0' });
    await p2.evaluate(() => startPremiumOnboarding());
    await p2.waitForSelector('#page-saju-input.active');

    await p2.evaluate(() => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="m"]').checked = true;
      document.querySelector('#saju-date').value = '1990-03-15';
      document.querySelector('#saju-time').value = '12:00';
    });

    await p2.evaluate(() => submitSaju());
    await new Promise(r => setTimeout(r, 500));
    
    const isPremium = await p2.evaluate(() => document.querySelector('#page-premium-report').classList.contains('active'));
    if (isPremium) console.log("CASE_PREMIUM_START: PASS");
    else console.log("CASE_PREMIUM_START: FAIL");
    await p2.close();
  } catch(e) { console.log("CASE_PREMIUM_START: FAIL", e.message); }

  // 3. CASE_FREE_SAJU
  try {
    const p3 = await newPage();
    await p3.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });
    await p3.evaluate(() => navigate('#saju-input'));
    await p3.evaluate(() => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="m"]').checked = true;
      document.querySelector('#saju-date').value = '2000-01-01';
      document.querySelector('#saju-time').value = '12:00';
    });
    await p3.evaluate(() => submitSaju());
    await new Promise(r => setTimeout(r, 500));

    const html = await p3.evaluate(() => document.querySelector('#page-saju-result').innerHTML);

    const hasCTA = html.includes('운담재 Premium 보기');
    const hasDashboard = html.includes('주목할 전성기 후보') || html.includes('id="premium-candidates-container"');

    if (hasCTA && !hasDashboard) console.log("CASE_FREE_SAJU: PASS");
    else console.log("CASE_FREE_SAJU: FAIL", {hasCTA, hasDashboard});
    await p3.close();
  } catch(e) { console.log("CASE_FREE_SAJU: FAIL", e.message); }

  // 4. CASE_PREMIUM_REPORT
  try {
    const p4 = await newPage();
    await p4.goto('http://localhost:8083/', { waitUntil: 'networkidle0' });
    
    await p4.evaluate(() => navigate('#saju-input'));
    await p4.evaluate(() => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="m"]').checked = true;
      document.querySelector('#saju-date').value = '1985-05-15';
      document.querySelector('#saju-time').value = '12:00';
    });
    await p4.evaluate(() => submitSaju());
    await new Promise(r => setTimeout(r, 500));

    await p4.evaluate(() => navigate('#premium-report'));
    await p4.waitForSelector('#page-premium-report.active');

    const html = await p4.evaluate(() => document.querySelector('#premium-candidates-container').innerHTML);
    if (html.includes('현재 나의 위치') && html.includes('다음 핵심 시기') && html.includes('전성기 후보') && html.includes('기회 구간') && html.includes('주의 구간') && html.includes('준비할 것') && html.includes('행동할 것')) {
      console.log("CASE_PREMIUM_REPORT: PASS");
    } else {
      console.log("CASE_PREMIUM_REPORT: FAIL - Missing keywords");
    }
    await p4.close();
  } catch(e) { console.log("CASE_PREMIUM_REPORT: FAIL", e.message); }

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
