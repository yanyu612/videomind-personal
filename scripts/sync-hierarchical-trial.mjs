#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, rmdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { canonicalizeVideoUrl } from '../src/core/video-url.mjs';
import { categoryHierarchy } from '../src/core/category-hierarchy.mjs';
import { DoubaoAnalyzer } from '../src/analyzers/doubao.mjs';

const input = resolve(process.argv[2] || 'data/template-trial-all-results.json');
const vault = resolve(process.argv[3] || 'F:\\jiyi\\闻叙的记忆小屋\\抖音收藏知识库');
const incomingRows = JSON.parse(readFileSync(input, 'utf8'));
const responseParser = new DoubaoAnalyzer(null);
const ledgerDir = join(vault, '系统', '视频ID索引');
const ledgerJson = join(ledgerDir, '已收藏视频数据.json');
const ledgerMd = join(ledgerDir, '已收藏视频ID.md');
let savedRows = [];
try {
  if (existsSync(ledgerJson)) savedRows = JSON.parse(readFileSync(ledgerJson, 'utf8'));
} catch { savedRows = []; }

// Obsidian is the durable source of truth. Merge rather than replace so a
// cleared local SQLite cache can never erase previously recorded videos.
const mergedRows = new Map();
for (const row of [...savedRows, ...incomingRows]) {
  if (!row?.url) continue;
  const url = canonicalizeVideoUrl(row.url);
  mergedRows.set(url, { ...row, originalUrl: row.originalUrl || row.url, url });
}
const rows = [...mergedRows.values()];

function extractObject(text) {
  const parsed = responseParser.tryParseJSON(text);
  if (parsed) return parsed;
  const start = text.indexOf('{');
  if (start < 0) return {};
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { return {}; }
    }
  }
  return {};
}

function safe(name) {
  return String(name || '未命名').replace(/[\\/:*?"<>|\x00-\x1f]/g, '-').trim().slice(0, 90);
}

function link(path, label) { return `[[${path}|${label}]]`; }
function categoryIndexName(name) { return `「${safe(name)}」`; }
function categoryIndexPath(parts) {
  return `分类/${parts.join('/')}/${categoryIndexName(parts.at(-1))}`;
}
function bullets(items) {
  if (!items || (Array.isArray(items) && items.length === 0)) return '- 暂无';
  return (Array.isArray(items) ? items : [items]).map(x => `- ${x}`).join('\n');
}

function detailBlock(data) {
  const d = data.category_details || {};
  if (data.content_type === '家居清洁') return `## 清洁方法\n\n**清洁对象：** ${d.cleaning_target || '未提取'}\n\n### 工具与材料\n\n${bullets(d.materials)}\n\n### 操作步骤\n\n${bullets(d.steps)}\n\n> [!warning] 安全提醒\n> ${bullets(d.safety).replace(/^- /gm, '')}\n\n### 容易翻车\n\n${bullets(d.pitfalls)}`;
  if (data.content_type === '菜谱') return `## 菜谱\n\n**成品：** ${d.dish || '未提取'}\n\n### 食材与用量\n\n${bullets(d.ingredients)}\n\n### 制作步骤\n\n${bullets(d.steps)}\n\n**时间与火候：** ${Array.isArray(d.time_heat) ? d.time_heat.join('；') : (d.time_heat || '未提取')}\n\n### 可替换食材\n\n${bullets(d.substitutions)}\n\n### 容易翻车\n\n${bullets(d.pitfalls)}`;
  if (data.content_type === '运动') return `## 训练方案\n\n**训练目标：** ${d.goal || '未提取'}\n\n### 动作顺序\n\n${bullets(d.exercises)}\n\n**组数/时长/频率：** ${Array.isArray(d.dosage) ? d.dosage.join('；') : (d.dosage || '未提取')}\n\n### 动作要领\n\n${bullets(d.form_cues)}\n\n### 禁忌与风险\n\n${bullets(d.contraindications)}\n\n### 退阶与进阶\n\n${bullets(d.regression_progression)}`;
  if (data.content_type === 'AI工具' || data.content_type === 'AI 工具') return `## 工具与复现\n\n**工具：** ${d.tool || '未提取'}\n\n**解决的问题：** ${d.problem_solved || '未提取'}\n\n### 操作步骤\n\n${bullets(d.steps)}\n\n### 成本与门槛\n\n${bullets(d.cost_requirements)}\n\n### 局限与坑\n\n${bullets(d.limitations)}`;
  if (data.content_type === '观点鸡汤') return `## 观点拆解\n\n**核心主张：** ${d.core_claim || '未提取'}\n\n### 论证\n\n${bullets(d.reasoning)}\n\n### 可取部分\n\n${bullets(d.useful_part)}\n\n### 情绪化表达\n\n${bullets(d.emotional_rhetoric)}\n\n### 反例与边界\n\n${bullets(d.counterexamples)}`;
  return `## 分类专属内容\n\n${bullets(Object.entries(d).map(([k,v]) => `**${k}：** ${Array.isArray(v) ? v.join('；') : v}`))}`;
}

const cards = rows.map(row => {
  const data = extractObject(row.analysis || '');
  const tree = categoryHierarchy(data, row).map(safe);
  const title = safe(data.title || row.title);
  return { row, data, tree, title };
});

mkdirSync(vault, { recursive: true });
mkdirSync(join(vault, '分类'), { recursive: true });
mkdirSync(join(vault, '视频'), { recursive: true });
mkdirSync(ledgerDir, { recursive: true });

// Remove generated cards that are no longer part of the valid checkpoint
// export. This also cleans up duplicates created by older template versions.
const desiredCardPaths = new Set(cards.map(card =>
  resolve(vault, '分类', ...card.tree, `${card.title}.md`).toLowerCase()
));
function removeObsoleteGeneratedCards(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) removeObsoleteGeneratedCards(path);
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      const text = readFileSync(path, 'utf8');
      if (text.includes('type: category-index')) {
        unlinkSync(path);
      } else if (text.includes('type: 视频知识卡') && !desiredCardPaths.has(resolve(path).toLowerCase())) {
        unlinkSync(path);
      }
    }
  }
}
removeObsoleteGeneratedCards(join(vault, '分类'));

const children = new Map();
const videosAt = new Map();
for (const card of cards) {
  for (let depth = 0; depth < 3; depth++) {
    const key = card.tree.slice(0, depth + 1).join('/');
    if (!children.has(key)) children.set(key, new Set());
    if (depth < 2) children.get(key).add(card.tree[depth + 1]);
  }
  const leaf = card.tree.join('/');
  if (!videosAt.has(leaf)) videosAt.set(leaf, []);
  videosAt.get(leaf).push(card);
}

const top = [...new Set(cards.map(c => c.tree[0]))];
const home = [
  '---', 'type: knowledge-home', 'tags: [抖音收藏, 知识地图]', '---', '',
  '# 抖音收藏知识库', '',
  '> 按“首页 → 大类 → 子类 → 视频”逐层浏览。关系图只保留这棵分类树。', '',
  '## 大类', '',
  ...top.map(x => `- ${link(categoryIndexPath([x]), x)}`), ''
];
writeFileSync(join(vault, '首页.md'), home.join('\n'), 'utf8');
// README used to duplicate 首页 and link to every video, which turned the
// Obsidian graph into a giant hub-and-spoke "sea urchin". 首页 is the only root.
const legacyReadme = join(vault, 'README.md');
if (existsSync(legacyReadme)) unlinkSync(legacyReadme);

// Folders are invisible in Obsidian's graph, so every category level gets one
// small index note. Each note links only to its parent and direct children (or
// videos at a leaf), producing a real tree instead of a flat hub.
for (const [key, childNames] of children) {
  const parts = key.split('/');
  const name = parts.at(-1);
  const legacyFile = join(vault, '分类', ...parts.slice(0, -1), `${safe(name)}.md`);
  const dir = join(vault, '分类', ...parts);
  mkdirSync(dir, { recursive: true });
  const directoryNote = join(dir, '目录.md');
  if (existsSync(directoryNote)) unlinkSync(directoryNote);
  if (existsSync(legacyFile)) unlinkSync(legacyFile);

  const parentLink = parts.length === 1
    ? link('首页', '返回首页')
    : link(categoryIndexPath(parts.slice(0, -1)), `返回${parts.at(-2)}`);
  const lines = [
    '---', 'type: category-index', `category_path: "${parts.join(' / ')}"`,
    'tags: [抖音收藏, 分类索引]', '---', '', `# ${name}`, '',
    `← ${parentLink}`, '',
  ];
  if (childNames.size > 0) {
    lines.push('## 子分类', '');
    for (const child of [...childNames].sort((a, b) => a.localeCompare(b, 'zh-CN'))) {
      lines.push(`- ${link(categoryIndexPath([...parts, child]), child)}`);
    }
  } else {
    lines.push('## 视频', '');
    const leafVideos = [...(videosAt.get(key) || [])]
      .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    for (const card of leafVideos) {
      lines.push(`- ${link(`分类/${card.tree.join('/')}/${card.title}`, card.title)}`);
    }
  }
  lines.push('');
  writeFileSync(join(dir, `${categoryIndexName(name)}.md`), lines.join('\n'), 'utf8');
}

// Old topic pages cross-linked hundreds of videos and overwhelmed the graph.
// Keep topic text inside each video card, but remove only generated topic notes.
const topicDir = join(vault, '主题');
if (existsSync(topicDir)) {
  for (const entry of readdirSync(topicDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const path = join(topicDir, entry.name);
    const text = readFileSync(path, 'utf8');
    if (text.includes('type: topic')) unlinkSync(path);
  }
  try { rmdirSync(topicDir); } catch { /* Preserve user-created topic notes. */ }
}

for (const card of cards) {
  const { row, data, tree, title } = card;
  const categoryPath = tree.join(' → ');
  const categoryTag = `分类/${tree.join('/')}`;
  const topicText = (data.topics || []).map(x => String(x).trim()).filter(Boolean).join('、') || '暂无';
  const leafIndex = link(categoryIndexPath(tree), tree.at(-1));
  const lines = [
    '---', 'type: 视频知识卡', `内容类型: ${data.content_type || '其他'}`, `原视频: "${row.url}"`,
    `整理时间: ${new Date().toISOString()}`, `tags: [抖音收藏, 视频知识卡, ${categoryTag}]`, '---', '',
    `# ${title}`, '', `> [!summary] 一句话说清楚\n> ${data.summary || '暂无摘要'}`, '',
    '## 这条视频讲了什么', '', bullets(data.key_points), '',
    '## 对我有什么用', '', `**适合：** ${data.suitable_for || '未提取'}`, '', `**不适合：** ${data.not_suitable_for || '未提取'}`, '',
    '### 可以直接做', '', bullets((data.action_items || []).map(x => `[ ] ${x}`)), '',
    detailBlock(data), '',
    '## 闻叙整理', '', `**保留理由：** ${data.retention_reason || '待判断'}`, '', '### 待验证', '', bullets(data.to_verify), '',
    '## 知识连接', '', `- **所属分类：** ${leafIndex}`, `- **分类路径：** ${categoryPath}`, `- **层级标签：** #${categoryTag}`, `- **相关主题：** ${topicText}`, '',
    '## 来源', '', `- [打开抖音原视频](${row.url})`, `- 读取状态：${data.access_status || '未知'}`, `- 内容依据：${(data.evidence || []).join('、') || '未知'}`, ''
  ];
  const dir = join(vault, '分类', ...tree);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${title}.md`), lines.join('\n'), 'utf8');

  // Remove only this generated card from the old duplicate 视频 tree.
  const oldVideoFile = join(vault, '视频', ...tree, `${title}.md`);
  if (existsSync(oldVideoFile)) unlinkSync(oldVideoFile);
  for (let depth = tree.length; depth >= 1; depth--) {
    const oldDir = join(vault, '视频', ...tree.slice(0, depth));
    if (existsSync(oldDir)) {
      try { rmdirSync(oldDir); } catch { break; }
    }
  }
}

function removeEmptyCategoryDirs(dir, keepRoot = false) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyCategoryDirs(join(dir, entry.name));
  }
  if (!keepRoot && readdirSync(dir).length === 0) rmdirSync(dir);
}
removeEmptyCategoryDirs(join(vault, '分类'), true);

function videoId(url) {
  return String(url || '').match(/\/(?:video|note)\/(\d+)/)?.[1]
    || String(url || '').match(/[?&]modal_id=(\d+)/)?.[1]
    || String(url || '未知');
}
const cardByUrl = new Map(cards.map(card => [canonicalizeVideoUrl(card.row.url), card]));
const ledgerLines = [
  '---', 'type: processed-video-index', 'tags: [抖音收藏, 视频ID索引, 系统]', '---', '',
  '# 已收藏并处理的视频 ID', '',
  '> 这是查重目录。清除电脑上的处理缓存后，VideoMind 会从这里恢复记录并跳过相同 ID。', '',
  `当前有效记录：**${rows.length}** 条`, '',
  '| 视频 ID | 标题 | 分类 | 原视频 |', '|---|---|---|---|',
];
for (const row of rows) {
  const card = cardByUrl.get(canonicalizeVideoUrl(row.url));
  const title = String(card?.title || row.title || '未命名').replace(/\|/g, '｜').replace(/\s+/g, ' ').trim();
  const category = card ? card.tree.join(' → ') : '待分类';
  // The ledger is for durable ID deduplication, not knowledge navigation. A
  // wikilink here would create another all-video hub in Obsidian's graph.
  ledgerLines.push(`| ${videoId(row.url)} | ${title} | ${category} | [打开](${row.url}) |`);
}
writeFileSync(ledgerJson, JSON.stringify(rows, null, 2), 'utf8');
writeFileSync(ledgerMd, ledgerLines.join('\n'), 'utf8');

console.log(`已写入 ${cards.length} 张视频知识卡和 ${children.size} 张树状分类索引。`);
console.log(`视频 ID 索引已保存 ${rows.length} 条记录。`);
