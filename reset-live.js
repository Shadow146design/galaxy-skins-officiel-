const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8888/', { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username:'insane', password:'testpass123'}) });
    await fetch('/api/live-match', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({isLive:false}) });
  });
  console.log('reset ok');
  await browser.close();
})();
