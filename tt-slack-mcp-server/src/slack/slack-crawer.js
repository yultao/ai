import puppeteer from 'puppeteer-core';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CHROME_PATH_MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_PATH_WIN = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // 视情况而定

const chromePath = process.platform === 'darwin' ? CHROME_PATH_MAC : CHROME_PATH_WIN;
// const userDataDir = path.join(os.homedir(), 'Library/Application Support/Google/Chrome'); // macOS 示例，Windows/Linux 请调整
const userDataDir = "C:/Users/yulta/AppData/Local/Google/Chrome/User Data";

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromePath,         // 使用你本机的 Chrome
    userDataDir: userDataDir,           // 使用你本地的登录状态
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://app.slack.com/client');

  console.log('✅ Slack 页面已打开，你已登录状态。按回车继续抓取...');
  await new Promise(resolve => process.stdin.once('data', resolve));

  // 以下是抓取逻辑省略，和之前一致
  // ...
}

run();
