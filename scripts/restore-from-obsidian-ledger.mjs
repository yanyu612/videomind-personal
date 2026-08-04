#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Checkpoint } from '../src/core/checkpoint.mjs';
import { canonicalizeVideoUrl } from '../src/core/video-url.mjs';

const dbPath = resolve(process.argv[2] || 'data/videomind-checkpoint.db');
const ledgerPath = resolve(process.argv[3] || 'F:\\jiyi\\闻叙的记忆小屋\\抖音收藏知识库\\系统\\视频ID索引\\已收藏视频数据.json');

if (!existsSync(ledgerPath)) {
  console.log('Obsidian 视频 ID 索引尚不存在，本次无需恢复。');
  process.exit(0);
}

const saved = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const checkpoint = new Checkpoint({ dbPath });
let restored = 0;
try {
  const rows = saved.filter(row => row?.url).map(row => ({
    ...row,
    originalUrl: row.originalUrl || row.url,
    url: canonicalizeVideoUrl(row.url),
  }));
  checkpoint.registerBatch(rows.map(row => ({ url: row.url, title: row.title })));
  for (const row of rows) {
    if (checkpoint.isCompleted(row.url)) continue;
    checkpoint.markCompleted(row.url, row);
    restored++;
  }
  console.log(`Obsidian ID 索引共 ${rows.length} 条，本次恢复 ${restored} 条处理记录。`);
} finally {
  checkpoint.close();
}
