import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
mkdirSync('./data/diagnostics', { recursive: true });

for (const [index, page] of context.pages().entries()) {
  console.log(JSON.stringify({ index, title: await page.title(), url: page.url() }));
  if (page.url().includes('doubao.com')) {
    const controls = await page.evaluate(() => ({
      textareas: [...document.querySelectorAll('textarea')].map(el => ({
        placeholder: el.getAttribute('placeholder'),
        className: el.className,
        ariaLabel: el.getAttribute('aria-label')
      })),
      editables: [...document.querySelectorAll('[contenteditable="true"]')].map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        dataSlateEditor: el.getAttribute('data-slate-editor'),
        className: el.className,
        text: (el.textContent || '').slice(0, 80)
      })),
      buttons: [...document.querySelectorAll('button')].slice(-30).map(el => ({
        title: el.getAttribute('title'),
        ariaLabel: el.getAttribute('aria-label'),
        className: el.className,
        text: (el.textContent || '').trim().slice(0, 80)
      }))
    }));
    console.log(JSON.stringify({ doubaoControls: controls }, null, 2));
    await page.screenshot({ path: './data/diagnostics/doubao-live.png', fullPage: false });
  }
}

// connectOverCDP 下调用 browser.close() 会把用户的整个调试浏览器关掉。
// 诊断脚本退出即可释放连接，保留浏览器给后续流水线使用。
