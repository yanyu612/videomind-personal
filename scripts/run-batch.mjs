#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Checkpoint } from '../src/core/checkpoint.mjs';

const rawBatchSize = process.argv[2] ?? '50';
const batchSize = Number.parseInt(rawBatchSize, 10);

if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
  console.error('Batch size must be a whole number from 1 to 500.');
  process.exit(1);
}

const cli = resolve('src', 'cli.mjs');
const ensureBrowser = resolve('scripts', 'ensure-browser.mjs');
const recoverDoubao = resolve('scripts', 'recover-finished-doubao-responses.mjs');
const hierarchicalSync = resolve('scripts', 'sync-hierarchical.mjs');
const exportCompleted = resolve('scripts', 'export-completed.mjs');
const restoreLedger = resolve('scripts', 'restore-from-obsidian-ledger.mjs');
const vault = 'F:\\jiyi\\闻叙的记忆小屋\\抖音收藏知识库';
const checkpointDb = resolve('data', 'videomind-checkpoint.db');

// One-click workflow: launch the dedicated Edge with Douyin + Doubao only
// when port 9222 is not already available.
const browserResult = spawnSync(process.execPath, [ensureBrowser], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: false,
});
if (browserResult.error) {
  console.error(browserResult.error.message);
  process.exit(1);
}
if (browserResult.status !== 0) process.exit(browserResult.status ?? 1);

// If the previous window was closed after Doubao visibly finished but before
// local commit, recover that complete JSON from the existing conversation.
const recoveryResult = spawnSync(process.execPath, [recoverDoubao, checkpointDb, vault, '9222'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: false,
});
if (recoveryResult.error) {
  console.error(recoveryResult.error.message);
  process.exit(1);
}
if (recoveryResult.status !== 0) process.exit(recoveryResult.status ?? 1);

// Recover dedupe state from the Obsidian-owned ledger before calculating how
// far to scan. This survives an accidental local-cache clear.
const restoreResult = spawnSync(process.execPath, [
  restoreLedger,
  checkpointDb,
  resolve(vault, '系统', '视频ID索引', '已收藏视频数据.json'),
], { cwd: process.cwd(), stdio: 'inherit', windowsHide: false });
if (restoreResult.error) {
  console.error(restoreResult.error.message);
  process.exit(1);
}
if (restoreResult.status !== 0) process.exit(restoreResult.status ?? 1);

// Douyin shows newest favorites first. Scan only far enough to pass the
// already-completed prefix and find this run's requested unfinished items.
const checkpoint = new Checkpoint({ dbPath: checkpointDb });
const progress = checkpoint.getStats();
checkpoint.close();
const scanLimit = Math.min(10000, progress.completed + batchSize);

console.log(`Saved progress: ${progress.completed} completed.`);
console.log(`This run will scan at most ${scanLimit} favorites to find ${batchSize} unfinished videos.`);

const steps = [
  {
    label: '[0/3] Repairing Obsidian from saved completed results...',
    args: [exportCompleted, 'data/videomind-checkpoint.db', 'data/video_analysis.json'],
  },
  {
    label: '[0/3] Writing recovered results to Obsidian...',
    args: [hierarchicalSync, 'data/video_analysis.json', vault],
  },
  {
    label: '[1/3] Collecting Douyin favorites...',
    args: [cli, 'collect', '--platform', 'douyin', '--collection', 'favorites', '--cdp-port', '9222', '--max-videos', String(scanLimit), '--output-file', 'data/video_list.json'],
  },
  {
    label: '[1/3] Checking Douyin and Doubao tabs before analysis...',
    args: [ensureBrowser],
  },
  {
    label: `[2/3] Sending up to ${batchSize} unfinished videos to Doubao...`,
    args: [cli, 'analyze', '--analyzer', 'doubao', '--mode', 'sequential', '--cdp-port', '9222', '--max-videos', String(batchSize), '--input-file', 'data/video_list.json', '--output-file', 'data/video_analysis.json', '--checkpoint-db', 'data/videomind-checkpoint.db'],
  },
  {
    label: '[3/3] Classifying and writing the accepted Obsidian template...',
    args: [hierarchicalSync, 'data/video_analysis.json', vault],
  },
];

for (const step of steps) {
  console.log(`\n${step.label}`);
  const result = spawnSync(process.execPath, step.args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    windowsHide: false,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
