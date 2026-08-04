#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Checkpoint } from '../src/core/checkpoint.mjs';

const dbPath = resolve(process.argv[2] || 'data/videomind-checkpoint.db');
const outputPath = resolve(process.argv[3] || 'data/video_analysis.json');
const checkpoint = new Checkpoint({ dbPath });

try {
  const resetUnreadable = checkpoint.resetUnreadableCompleted();
  const completed = checkpoint.getCompletedResults();
  writeFileSync(outputPath, JSON.stringify(completed, null, 2), 'utf8');
  console.log(`已从缓存恢复 ${completed.length} 条有效总结。`);
  if (resetUnreadable > 0) {
    console.log(`另有 ${resetUnreadable} 条“无法读取”已退回待处理。`);
  }
} finally {
  checkpoint.close();
}
