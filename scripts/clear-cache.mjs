#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Checkpoint } from '../src/core/checkpoint.mjs';

const dbPath = resolve(process.argv[2] || join('data', 'videomind-checkpoint.db'));
const analysisPath = resolve(process.argv[3] || join('data', 'video_analysis.json'));

mkdirSync(dirname(dbPath), { recursive: true });

const checkpoint = new Checkpoint({ dbPath });
try {
  const before = checkpoint.getStats();
  checkpoint.clear();
  writeFileSync(analysisPath, '[]\n', 'utf8');

  console.log(`Cleared ${before.total} cached processing records.`);
  console.log('Obsidian notes were NOT deleted.');
  console.log('No local backup was created; Obsidian remains the durable record.');
} finally {
  checkpoint.close();
}
