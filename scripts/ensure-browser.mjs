#!/usr/bin/env node
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const CDP_PORT = 9222;

function browserReady() {
  return new Promise(resolveReady => {
    const req = http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, res => {
      res.resume();
      resolveReady(res.statusCode === 200);
    });
    req.on('error', () => resolveReady(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolveReady(false);
    });
  });
}

async function ensureRequiredTabs() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  {
    const context = browser.contexts()[0];
    if (!context) throw new Error('专用 Edge 没有可用窗口');
    const pages = context.pages();
    if (!pages.some(page => page.url().includes('douyin.com'))) {
      const douyin = await context.newPage();
      await douyin.goto('https://www.douyin.com/user/self?from_tab_name=main&showTab=favorite_collection', {
        waitUntil: 'domcontentloaded', timeout: 30000
      });
      console.log('已补开抖音收藏页。');
    }
    if (!context.pages().some(page => page.url().includes('doubao.com'))) {
      const doubao = await context.newPage();
      await doubao.goto('https://www.doubao.com/chat/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('已补开豆包页。');
    }
  }
}

if (await browserReady()) {
  await ensureRequiredTabs();
  console.log('VideoMind 专用 Edge 已经打开，直接继续。');
  process.exit(0);
}

console.log('VideoMind 专用 Edge 尚未打开，正在自动启动抖音和豆包……');
const result = spawnSync(process.execPath, [resolve('scripts', 'launch-edge.mjs')], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: false,
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.status !== 0 || !(await browserReady())) {
  console.error('专用 Edge 启动失败，请关闭后重新运行②。');
  process.exit(result.status || 1);
}
await ensureRequiredTabs();
process.exit(0);
console.log('抖音和豆包已经就绪，继续整理。');
