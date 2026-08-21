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
  server.listen(8082);

  const uri = 'http://localhost:8082/';
  await page.goto(uri, { waitUntil: 'networkidle0' });

  async function runCase(year, rawDateStr) {
    console.log("Inputting Case " + year);
    await page.evaluate(() => navigate('#saju-input'));
    await page.waitForSelector('#saju-name', { visible: true });

    // Fill form
    await page.evaluate((dStr) => {
      document.querySelector('#saju-name').value = 'Test';
      document.querySelector('input[name="saju-gender"][value="f"]').checked = true;
      document.querySelector('#saju-date').value = dStr;
      document.querySelector('#saju-time').value = '12:00';
    }, rawDateStr);

    await page.evaluate(() => submitSaju());

    // Check if we advanced to result page
    await new Promise(r => setTimeout(r, 500));
    const isError = await page.evaluate(() => {
      return document.querySelector('#page-saju-result').classList.contains('active') === false;
    });

    if (isError) {
      console.log("CASE_INPUT_" + year + "_RESULT: VALIDATION_FAILED");
      return;
    }

    await page.evaluate(() => navigate('#premium-report'));
    await page.waitForSelector('#page-premium-report.active');

    const html = await page.evaluate(() => document.getElementById('premium-has-data').innerHTML);
    if (html.includes('운담재 PREMIUM')) {
      console.log("CASE_" + year + "_RESULT: SUCCESS");
    } else {
      console.log("CASE_" + year + "_RESULT: FAIL");
    }
  }

  await runCase('1989', '1989-03-15');
  await runCase('1990', '1990-03-15');
  await runCase('1980', '1980-03-15');
  await runCase('1990_FORMAT', '19900315');
  await runCase('INVALID', '19900229');

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
