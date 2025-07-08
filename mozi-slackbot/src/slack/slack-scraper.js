// scrapeSlack.mjs 或 scrapeSlack.js（取决于你设置）

import puppeteer from 'puppeteer';
import fs from 'fs/promises'; // 使用 Promise 版本的 fs

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.goto('https://app.slack.com/client/T093KD42SLC/C094QBEMW05');

  console.log('⏳ 请登录并手动进入你要抓取的频道，完成后按回车...');
  await new Promise(resolve => process.stdin.once('data', resolve));

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(1000);
  }

  const messages = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-qa="message_content"]');
    const results = [];
    nodes.forEach(n => {
      results.push(n.innerText);
    });
    return results;
  });

  await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
  console.log(`✅ 抓取完成，共 ${messages.length} 条消息`);
  await browser.close();
}

run();
