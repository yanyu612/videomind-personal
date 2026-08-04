#!/usr/bin/env node
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { Checkpoint } from '../src/core/checkpoint.mjs';
import { canonicalizeVideoUrl } from '../src/core/video-url.mjs';
import { recordCompletedVideo, DEFAULT_VAULT } from '../src/core/obsidian-ledger.mjs';
import { DoubaoAnalyzer } from '../src/analyzers/doubao.mjs';

const dbPath = resolve(process.argv[2] || 'data/videomind-checkpoint.db');
const vault = resolve(process.argv[3] || DEFAULT_VAULT);
const port = Number(process.argv[4] || 9222);
const checkpoint = new Checkpoint({ dbPath });
let browser;
let recovered = 0;

try {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const tasks = new Map(checkpoint.db.prepare(`
    SELECT url, title, status FROM analysis_tasks
    WHERE status IN ('in_progress', 'failed')
  `).all().map(row => [canonicalizeVideoUrl(row.url), row]));
  if (tasks.size === 0) {
    console.log('没有等待抢救的豆包回答。');
    process.exitCode = 0;
  } else {
    const candidates = new Map();
    for (const context of browser.contexts()) for (const page of context.pages()) {
      if (!page.url().includes('doubao.com')) continue;
      const messages = await page.locator('.md-box-root, .flow-markdown-body, [class*="flow-markdown-body"]').evaluateAll(nodes => nodes.map(node => ({
        text: node.textContent || '',
        isUser: [node, node.parentElement, node.parentElement?.parentElement, node.parentElement?.parentElement?.parentElement]
          .some(ancestor => String(ancestor?.className || '').includes('send-msg-bubble')),
      })));
      let currentUrl = null;
      for (const message of messages) {
        if (message.isUser) {
          const found = message.text.match(/https:\/\/www\.douyin\.com\/(?:video|note)\/\d+/)?.[0];
          currentUrl = found ? canonicalizeVideoUrl(found) : null;
        } else if (currentUrl && tasks.has(currentUrl)) {
          candidates.set(currentUrl, message.text);
        }
      }
    }

    const parser = new DoubaoAnalyzer(null);
    for (const [url, responseText] of candidates) {
      const parsed = parser.tryParseJSON(responseText);
      if (!parsed || !parsed.title || parsed.access_status === '无法读取') continue;
      const task = tasks.get(url);
      const video = { url, title: task.title || parsed.title, author: '', tags: [], comments: [] };
      const result = parser.parseResponse(video, responseText);
      checkpoint.markCompleted(url, result);
      recordCompletedVideo(video, result, { vault });
      recovered++;
    }
    console.log(`从豆包页面抢救并立即保存了 ${recovered} 条已生成回答。`);
  }
} catch (error) {
  console.error(`豆包回答恢复检查失败：${error.message}`);
  process.exitCode = 1;
} finally {
  checkpoint.close();
}

// Drop only this helper's CDP socket; keep the persistent Edge and tabs alive.
process.exit(process.exitCode || 0);
