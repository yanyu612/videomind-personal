import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { canonicalizeVideoUrl } from './video-url.mjs';

export const DEFAULT_VAULT = 'F:\\jiyi\\闻叙的记忆小屋\\抖音收藏知识库';

export function getLedgerPaths(vault = DEFAULT_VAULT) {
  const dir = resolve(vault, '系统', '视频ID索引');
  return {
    dir,
    json: join(dir, '已收藏视频数据.json'),
    markdown: join(dir, '已收藏视频ID.md'),
  };
}

function videoId(url) {
  return String(url || '').match(/\/(?:video|note)\/(\d+)/)?.[1]
    || String(url || '').match(/[?&]modal_id=(\d+)/)?.[1]
    || String(url || '未知');
}

function createIndex(markdown) {
  if (existsSync(markdown)) return;
  writeFileSync(markdown, [
    '---', 'type: processed-video-index', 'tags: [抖音收藏, 视频ID索引, 系统]', '---', '',
    '# 已收藏并处理的视频 ID', '',
    '> 每成功生成一条总结就立即追加；清除本地缓存后可从这里恢复并查重。', '',
    '| 视频 ID | 标题 | 分类 | 原视频 |', '|---|---|---|---|', ''
  ].join('\n'), 'utf8');
}

/** Persist one successful result immediately, without waiting for the batch. */
export function recordCompletedVideo(video, result, { vault = DEFAULT_VAULT } = {}) {
  const paths = getLedgerPaths(vault);
  mkdirSync(paths.dir, { recursive: true });

  let rows = [];
  try {
    if (existsSync(paths.json)) rows = JSON.parse(readFileSync(paths.json, 'utf8'));
  } catch { rows = []; }

  const url = canonicalizeVideoUrl(result?.url || video?.url);
  if (!url) throw new Error('Cannot record completed video without URL');
  const existingIndex = rows.findIndex(row => canonicalizeVideoUrl(row?.url) === url);
  const row = {
    ...video,
    ...result,
    originalUrl: result?.originalUrl || video?.originalUrl || video?.url || url,
    url,
    title: result?.title || video?.title || '未命名视频',
    ledgerSavedAt: new Date().toISOString(),
  };
  if (existingIndex >= 0) rows[existingIndex] = row;
  else rows.push(row);

  const tempJson = `${paths.json}.tmp`;
  writeFileSync(tempJson, JSON.stringify(rows, null, 2), 'utf8');
  renameSync(tempJson, paths.json);

  createIndex(paths.markdown);
  if (existingIndex < 0) {
    const title = String(row.title).replace(/\|/g, '｜').replace(/\s+/g, ' ').trim();
    appendFileSync(paths.markdown, `| ${videoId(url)} | ${title} | 等待本批分类 | [打开](${url}) |\n`, 'utf8');
  }
  return { added: existingIndex < 0, count: rows.length, id: videoId(url) };
}
