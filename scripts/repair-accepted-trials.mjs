#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Checkpoint } from '../src/core/checkpoint.mjs';
import { canonicalizeVideoUrl } from '../src/core/video-url.mjs';

const dbPath = resolve(process.argv[2] || 'data/videomind-checkpoint.db');
const trialPath = resolve(process.argv[3] || 'data/template-trial-all-results.json');
const checkpoint = new Checkpoint({ dbPath });

try {
  const reset = checkpoint.resetUnreadableCompleted();
  const trials = JSON.parse(readFileSync(trialPath, 'utf8'));
  const accepted = trials.map(row => ({
    ...row,
    originalUrl: row.originalUrl || row.url,
    url: canonicalizeVideoUrl(row.url),
  }));
  checkpoint.registerBatch(accepted.map(row => ({ url: row.url, title: row.title })));
  for (const row of accepted) checkpoint.markCompleted(row.url, row);
  console.log(`已撤回 ${reset} 条无效旧总结，并保留 ${accepted.length} 条确认过的试做母版。`);
  console.log(JSON.stringify(checkpoint.getStats()));
} finally {
  checkpoint.close();
}
