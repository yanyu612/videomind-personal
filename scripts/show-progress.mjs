import { existsSync, readFileSync } from 'node:fs';
import { Checkpoint } from '../src/core/checkpoint.mjs';

const listPath = './data/video_list.json';
const dbPath = './data/videomind-checkpoint.db';

let collected = 0;
if (existsSync(listPath)) {
  try {
    const value = JSON.parse(readFileSync(listPath, 'utf8'));
    collected = Array.isArray(value) ? value.length : 0;
  } catch {}
}

const checkpoint = new Checkpoint({ enabled: true, dbPath });
const stats = checkpoint.getStats();
checkpoint.close();

console.log('');
console.log('========== VideoMind 当前进度 ==========');
console.log(`最近采集到的收藏：${collected} 条`);
console.log(`已进入处理队列：  ${stats.total} 条`);
console.log(`已经总结完成：    ${stats.completed} 条`);
console.log(`等待处理：        ${stats.pending} 条`);
console.log(`上次中断中：      ${stats.in_progress} 条`);
console.log(`处理失败：        ${stats.failed} 条`);
console.log('========================================');
console.log('');
