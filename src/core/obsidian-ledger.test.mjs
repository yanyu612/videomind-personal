import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getLedgerPaths, recordCompletedVideo } from './obsidian-ledger.mjs';

const vault = mkdtempSync(join(tmpdir(), 'videomind-ledger-'));
after(() => rmSync(vault, { recursive: true, force: true }));

describe('Obsidian immediate video-ID ledger', () => {
  it('writes each successful result immediately and deduplicates by video ID', () => {
    const video = { url: 'https://www.douyin.com/user/self?modal_id=123456', title: '测试视频' };
    const first = recordCompletedVideo(video, { analysis: '{"access_status":"部分读取"}' }, { vault });
    const second = recordCompletedVideo(video, { analysis: '{"access_status":"可读取"}' }, { vault });
    const paths = getLedgerPaths(vault);
    const rows = JSON.parse(readFileSync(paths.json, 'utf8'));
    const markdown = readFileSync(paths.markdown, 'utf8');

    assert.equal(first.added, true);
    assert.equal(second.added, false);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].url, 'https://www.douyin.com/video/123456');
    assert.equal((markdown.match(/\| 123456 \|/g) || []).length, 1);
    assert.equal(existsSync(paths.markdown), true);
  });
});
