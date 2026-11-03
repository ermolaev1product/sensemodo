const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {})});
  const report = {checked:[],errors:[],requests:[]};
  for (const width of [1440,768,390,320]) {
    for (const lang of ['ru','sr']) {
      const context = await browser.newContext({viewport:{width,height:width<600?844:1000},acceptDownloads:true});
      const page = await context.newPage();
      await page.route('http://127.0.0.1:4180/**', async route => {
        const file = new URL(route.request().url()).pathname;
        const local = 'out/' + (file === '/' ? 'index.html' : file.slice(1));
        const mime = {html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',svg:'image/svg+xml'}[local.split('.').pop()];
        await route.fulfill({status:fs.existsSync(local)?200:404,contentType:mime||'text/plain',body:fs.existsSync(local)?fs.readFileSync(local):'Not found'});
      });
      page.on('pageerror', e=>report.errors.push(e.message));
      page.on('console', m=>{if(m.type()==='error') report.errors.push(m.text())});
      page.on('request', r=>report.requests.push({url:r.url(),method:r.method()}));
      await page.goto('http://127.0.0.1:4180/?lang='+lang);
      await page.waitForSelector('.product-card');
      assert.equal(await page.locator('html').getAttribute('lang'),lang==='ru'?'ru':'sr-Latn');
      assert.equal(await page.locator('.product-card').count(),3);
      const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert.ok(overflow.scroll<=overflow.width,`${width} ${lang}: overflow ${JSON.stringify(overflow)}`);
      await page.screenshot({path:`qa/${width}-${lang}.png`,fullPage:true});
      for (const task of ['map','pilot','partner']) {
        await page.locator(`[data-task="${task}"]`).click();
        assert.equal(await page.locator('.product-card.recommended').getAttribute('data-product'),task);
        assert.equal(await page.locator(`[data-task="${task}"]`).getAttribute('aria-pressed'),'true');
        await page.locator(`[data-product-brief="${task}"]`).click();
        assert.ok(await page.locator('#brief-dialog').isVisible());
        const productTitle=await page.locator(`#product-${task} h3`).innerText();
        assert.equal(await page.locator('#brief-product-name').innerText(),productTitle);
        await page.locator('#business').fill(lang==='ru'?'B2B-сервис':'B2B servis');
        await page.locator('#problem').fill('');
        await page.locator('button[type="submit"]').click();
        assert.ok(await page.locator('#brief-form').isVisible(),'Empty brief must not proceed');
        await page.locator('#problem').fill(lang==='ru'?'Сократить время подготовки отчёта':'Smanjiti vreme za pripremu izveštaja');
        await page.locator('#outcome').fill(lang==='ru'?'Сравнить время до и после':'Uporediti vreme pre i posle');
        await page.locator('button[type="submit"]').click();
        assert.ok(await page.locator('#brief-result').isVisible());
        const brief=await page.locator('#brief-preview').inputValue();
        assert.ok(brief.includes(productTitle));
        if(lang==='sr') assert.ok(!/[А-Яа-яЁё]/.test(brief),'Serbian brief should be fully translated');
        const downloadPromise=page.waitForEvent('download');
        await page.locator('#download-brief').click();
        const download=await downloadPromise;
        assert.equal(download.suggestedFilename(),`ermolayev-ai-brief-${lang}.txt`);
        const downloadPath=await download.path();
        assert.equal(fs.readFileSync(downloadPath,'utf8').replace(/^\uFEFF/,''),brief);
        await page.locator('#copy-brief').click();
        assert.ok((await page.locator('#brief-status').innerText()).length>10);
        if(width===390&&task==='pilot') await page.screenshot({path:`qa/modal-${lang}.png`});
        await page.keyboard.press('Escape');
        assert.ok(!(await page.locator('#brief-dialog').isVisible()));
        assert.equal(await page.evaluate(()=>document.activeElement.dataset.productBrief),task);
      }
      await page.locator('[data-lang="'+(lang==='ru'?'sr':'ru')+'"]').click();
      assert.equal(await page.locator('.product-card.recommended').getAttribute('data-product'),'partner');
      assert.ok((await page.locator('#hero-title').innerText()).length>5);
      if(lang==='ru') assert.ok(!/[А-Яа-яЁё]/.test(await page.locator('main').innerText()),'No Russian text remains in Serbian page');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('lang'),lang==='ru'?'sr-Latn':'ru');
      await page.locator('[data-open-brief]').click();
      assert.equal(await page.locator('#problem').inputValue(),'','Brief content should not persist on reload');
      await page.keyboard.press('Escape');
      report.checked.push({width,lang,overflow:false,products:3,download:'verified',languageSwitch:'verified'});
      await context.close();
    }
  }
  assert.deepEqual(report.errors,[]);
  assert.ok(report.requests.every(r=>r.url.startsWith('http://127.0.0.1:4180/') && r.method==='GET'),'No external or POST requests');
  report.requestCount=report.requests.length;delete report.requests;
  fs.writeFileSync('qa/report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
