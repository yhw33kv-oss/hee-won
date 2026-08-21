const puppeteer = require('C:/Users/User/AppData/Roaming/npm/node_modules/puppeteer');

(async () => {
  console.log("Starting Browser Test...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  let consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });
  page.on('dialog', async dialog => {
    console.log("DIALOG: ", dialog.message());
    await dialog.accept();
  });

  const http = require('http');
  const fs = require('fs');
  const path = require('path');
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
  server.listen(8080);

  const uri = 'http://localhost:8080/';
  await page.goto(uri, { waitUntil: 'networkidle0' });
  await page.evaluate(() => navigate('#saju-input'));
  async function runCase(year, month, day, expectedCount) {
    console.log(`\nInputting Case ${year}...`);
    await page.evaluate(() => navigate('#saju-input'));
    await page.waitForSelector('#saju-name', { visible: true });
    await page.evaluate((y, m, d) => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="f"]').checked = true;
      document.querySelector('#saju-date').value = `${y}-${m}-${d}`;
      document.querySelector('#saju-time').value = '12:00';
    }, year, month, day);

    await page.evaluate(() => submitSaju());
    await page.waitForSelector('#page-saju-result.active');
    
    console.log("Navigating to Premium...");
    await page.evaluate(() => navigate('#premium-report'));
    await page.waitForSelector('#page-premium-report.active');

    const html = await page.evaluate(() => document.getElementById('premium-has-data').innerHTML);
    if (html.includes('분석 중 오류가 발생했습니다.')) {
      console.log(`CASE_${year}_RESULT: ERROR_MESSAGE_FOUND`);
    } else {
      console.log(`CASE_${year}_RESULT: SUCCESS`);
    }
  }

  await runCase('1989', '03', '15');
  await runCase('1990', '03', '15');

  console.log("\nCONSOLE_ERRORS:");
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log(e));
  } else {
    console.log("NONE");
  }

  await browser.close();
  server.close();
})();
