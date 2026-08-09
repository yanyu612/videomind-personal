import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/sync-hierarchical-trial.mjs');
const temporary = [];

afterEach(() => {
  for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function makeRow(id, title, analysis) {
  return {
    url: `https://www.douyin.com/video/${id}`,
    title,
    platform: 'douyin',
    analyzer: 'doubao',
    analysis: JSON.stringify(analysis),
  };
}

describe('hierarchical Obsidian sync', () => {
  it('creates one tree root and removes generated hub-and-spoke links', () => {
    const root = mkdtempSync(join(tmpdir(), 'videomind-tree-'));
    temporary.push(root);
    const vault = join(root, 'vault');
    const input = join(root, 'rows.json');
    mkdirSync(join(vault, '主题'), { recursive: true });
    writeFileSync(join(vault, 'README.md'), 'old duplicate hub', 'utf8');
    writeFileSync(join(vault, '主题', '旧生成主题.md'), '---\ntype: topic\n---\n', 'utf8');
    writeFileSync(join(vault, '主题', '我的笔记.md'), '# 这是用户笔记\n', 'utf8');

    const rows = [
      makeRow('10001', '清洁视频', {
        title: '清洁视频', content_type: '家居清洁', summary: '摘要',
        topics: ['清洁技巧'], key_points: ['要点'],
      }),
      makeRow('10002', '英剧视频', {
        title: '英剧视频', content_type: '娱乐', category_secondary: '英剧',
        summary: '摘要', topics: ['电视剧'], key_points: ['要点'],
      }),
      makeRow('10003', '清洁', {
        title: '清洁', content_type: '家居清洁', summary: '同名冲突测试',
        topics: ['清洁'], key_points: ['要点'],
      }),
    ];
    writeFileSync(input, JSON.stringify(rows), 'utf8');

    const result = spawnSync(process.execPath, [script, input, vault], {
      cwd: resolve('.'), encoding: 'utf8', timeout: 20_000,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    assert.equal(existsSync(join(vault, 'README.md')), false);
    assert.equal(existsSync(join(vault, '主题', '旧生成主题.md')), false);
    assert.equal(existsSync(join(vault, '主题', '我的笔记.md')), true);

    const home = readFileSync(join(vault, '首页.md'), 'utf8');
    assert.match(home, /\[\[分类\/分类\|分类\]\]/);
    assert.match(home, /\[\[视频\/视频\|视频\]\]/);
    assert.match(home, /\[\[系统\/系统\|系统\]\]/);
    assert.match(home, /\[\[主题\/主题\|主题\]\]/);
    assert.equal((home.match(/\[\[/g) || []).length, 4);
    assert.doesNotMatch(home, /清洁视频|英剧视频/);

    const categoryRoot = readFileSync(join(vault, '分类', '分类.md'), 'utf8');
    assert.match(categoryRoot, /\[\[分类\/生活\/「生活」\|生活\]\]/);
    assert.equal(existsSync(join(vault, '视频', '视频.md')), true);
    assert.equal(existsSync(join(vault, '系统', '系统.md')), true);
    assert.equal(existsSync(join(vault, '主题', '主题.md')), true);

    const life = readFileSync(join(vault, '分类', '生活', '「生活」.md'), 'utf8');
    assert.match(life, /\[\[分类\/分类\|返回分类\]\]/);
    assert.match(life, /\[\[分类\/生活\/家庭管理\/「家庭管理」\|家庭管理\]\]/);
    assert.match(life, /\[\[分类\/生活\/休闲娱乐\/「休闲娱乐」\|休闲娱乐\]\]/);

    const leaf = readFileSync(join(vault, '分类', '生活', '家庭管理', '清洁', '「清洁」.md'), 'utf8');
    assert.match(leaf, /\[\[分类\/生活\/家庭管理\/清洁\/清洁视频\|清洁视频\]\]/);
    assert.match(leaf, /\[\[分类\/生活\/家庭管理\/清洁\/清洁\|清洁\]\]/);
    assert.equal(existsSync(join(vault, '分类', '生活', '家庭管理', '清洁', '清洁.md')), true);

    const video = readFileSync(join(vault, '分类', '生活', '家庭管理', '清洁', '清洁视频.md'), 'utf8');
    assert.match(video, /所属分类.*\[\[分类\/生活\/家庭管理\/清洁\/「清洁」\|清洁\]\]/);
    assert.doesNotMatch(video, /\[\[首页|\[\[主题\//);
    assert.doesNotMatch(video, /^tags:/m);

    const ledger = readFileSync(join(vault, '系统', '视频ID索引', '已收藏视频ID.md'), 'utf8');
    assert.doesNotMatch(ledger, /\[\[分类\//);
  });
});
