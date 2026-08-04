import { chromium } from 'playwright-core';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];

for (const [index, page] of context.pages().entries()) {
  if (!page.url().includes('doubao.com')) continue;
  const result = await page.evaluate(() => {
    const probes = [
      '[class*="markdown"]',
      '[class*="message"]',
      '[class*="answer"]',
      '[class*="response"]',
      '[data-testid*="message"]',
      '[data-testid*="answer"]'
    ];
    const selectors = probes.map(selector => {
      const elements = [...document.querySelectorAll(selector)];
      return {
        selector,
        count: elements.length,
        samples: elements.slice(-3).map(el => ({
          tag: el.tagName,
          className: el.className,
          text: (el.innerText || el.textContent || '').trim().slice(0, 240)
        }))
      };
    });
    const key = 'skill_name';
    const matching = [...document.querySelectorAll('div,pre,code,p')]
      .filter(el => (el.innerText || el.textContent || '').includes(key))
      .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)
      .slice(0, 8)
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        text: (el.innerText || el.textContent || '').trim().slice(0, 500),
        parentClass: el.parentElement?.className || '',
        grandParentClass: el.parentElement?.parentElement?.className || ''
      }));
    return { selectors, matching, bodyTail: (document.body.innerText || '').slice(-3000) };
  });
  console.log(JSON.stringify({ index, title: await page.title(), url: page.url(), result }, null, 2));
}

// 保留用户的调试浏览器；进程退出会自动释放 CDP 连接。
