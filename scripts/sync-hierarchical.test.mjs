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

  it('keeps real subcategories visible and caps only video branches', () => {
    const root = mkdtempSync(join(tmpdir(), 'videomind-branches-'));
    temporary.push(root);
    const vault = join(root, 'vault');
    const input = join(root, 'rows.json');
    const rows = [];
    for (let i = 1; i <= 25; i++) {
      rows.push(makeRow(`200${String(i).padStart(2, '0')}`, `清洁视频 ${String(i).padStart(2, '0')}`, {
        title: `清洁视频 ${String(i).padStart(2, '0')}`, content_type: '家居清洁',
        summary: '摘要', key_points: ['要点'],
      }));
      rows.push(makeRow(`300${String(i).padStart(2, '0')}`, `学习视频 ${String(i).padStart(2, '0')}`, {
        title: `学习视频 ${String(i).padStart(2, '0')}`, content_type: '学习',
        category_secondary: `知识类型 ${String(i).padStart(2, '0')}`,
        summary: '摘要', key_points: ['要点'],
      }));
    }
    writeFileSync(input, JSON.stringify(rows), 'utf8');
    const result = spawnSync(process.execPath, [script, input, vault], {
      cwd: resolve('.'), encoding: 'utf8', timeout: 20_000,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const leaf = readFileSync(join(vault, '分类', '生活', '家庭管理', '清洁', '「清洁」.md'), 'utf8');
    assert.equal((leaf.match(/\[\[系统\/关系图分支/g) || []).length, 3);
    assert.doesNotMatch(leaf, /\[\[分类\/生活\/家庭管理\/清洁\/清洁视频/);

    const branchDir = join(vault, '系统', '关系图分支', '生活', '家庭管理', '清洁');
    const branches = ['视频分支-01.md', '视频分支-02.md', '视频分支-03.md']
      .map(name => readFileSync(join(branchDir, name), 'utf8'));
    const videoLink = /\[\[分类\/生活\/家庭管理\/清洁\/清洁视频/g;
    assert.equal((branches[0].match(videoLink) || []).length, 12);
    assert.equal((branches[1].match(videoLink) || []).length, 12);
    assert.equal((branches[2].match(videoLink) || []).length, 1);

    const firstVideo = readFileSync(
      join(vault, '分类', '生活', '家庭管理', '清洁', '清洁视频 01.md'), 'utf8',
    );
    assert.match(firstVideo, /所属分类.*\[\[系统\/关系图分支\/生活\/家庭管理\/清洁\/视频分支-01\|清洁\]\]/);
    assert.doesNotMatch(firstVideo, /所属分类.*「清洁」/);

    const learning = readFileSync(join(vault, '分类', '学习', '学习方法', '「学习方法」.md'), 'utf8');
    assert.equal((learning.match(/\[\[分类\/学习\/学习方法\/知识类型/g) || []).length, 25);
    assert.doesNotMatch(learning, /分类分支-/);
    const firstLearningCategory = readFileSync(
      join(vault, '分类', '学习', '学习方法', '知识类型 01', '「知识类型 01」.md'), 'utf8',
    );
    assert.match(firstLearningCategory, /\[\[分类\/学习\/学习方法\/「学习方法」\|返回学习方法\]\]/);
    assert.equal(existsSync(join(vault, '系统', '关系图分支', '学习', '学习方法', '分类分支-01.md')), false);
  });

  it('prefixes links from the detected Obsidian vault root', () => {
    const root = mkdtempSync(join(tmpdir(), 'videomind-rooted-links-'));
    temporary.push(root);
    mkdirSync(join(root, '.obsidian'), { recursive: true });
    const vault = join(root, '抖音收藏知识库');
    const input = join(root, 'rows.json');
    writeFileSync(input, JSON.stringify([
      makeRow('40001', '路径测试', {
        title: '路径测试', content_type: '家居清洁', summary: '摘要', key_points: ['要点'],
      }),
    ]), 'utf8');
    const result = spawnSync(process.execPath, [script, input, vault], {
      cwd: resolve('.'), encoding: 'utf8', timeout: 20_000,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const home = readFileSync(join(vault, '首页.md'), 'utf8');
    assert.match(home, /\[\[抖音收藏知识库\/分类\/分类\|分类\]\]/);
    const video = readFileSync(join(vault, '分类', '生活', '家庭管理', '清洁', '路径测试.md'), 'utf8');
    assert.match(video, /\[\[抖音收藏知识库\/分类\/生活\/家庭管理\/清洁\/「清洁」\|清洁\]\]/);
  });
});
