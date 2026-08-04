import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryHierarchy } from './category-hierarchy.mjs';

test('merges English and American TV recommendations into 电视剧', () => {
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_secondary: ['英国探案单元剧赏析'] }, { title: '#电视剧 #英剧推荐' }), ['生活', '休闲娱乐', '电视剧']);
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_secondary: ['美剧主观向梯队盘点'] }), ['生活', '休闲娱乐', '电视剧']);
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_secondary: ['美剧主观向梯队盘点'], topics: ['权力的游戏'] }), ['生活', '休闲娱乐', '电视剧']);
});

test('merges different video games into 游戏', () => {
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_secondary: ['Valorant 枪法训练与冲分方法论'] }), ['生活', '休闲娱乐', '游戏']);
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_primary: '游戏攻略' }, { title: '崩坏星穹铁道配队' }), ['生活', '休闲娱乐', '游戏']);
});

test('routes face retouching to photography instead of personal care', () => {
  assert.deepEqual(categoryHierarchy({ content_type: '美妆', category_secondary: ['面部瘦脸液化修图'] }), ['生活', '摄影与修图', '人像修图']);
});

test('groups celebrity-centered content under 明星', () => {
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_primary: '韩娱明星造型', topics: ['金玟庭 Winter', '明星发型赏析'] }), ['生活', '休闲娱乐', '明星']);
  assert.deepEqual(categoryHierarchy({ content_type: '观点鸡汤', category_primary: '文娱评论' }, { title: '内娱第一次出现舔狗系歌手' }), ['生活', '休闲娱乐', '明星']);
});

test('keeps opera rehearsal and backstage footage under 演出', () => {
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_primary: '戏曲文艺', category_secondary: '越剧晚会幕后花絮', topics: ['越剧演员彩排'] }), ['生活', '休闲娱乐', '演出']);
});

test('prefers 日常娱乐 for a dance-class daily-life clip', () => {
  assert.deepEqual(categoryHierarchy({ content_type: '娱乐', category_secondary: '少儿舞蹈生日常随拍' }), ['生活', '休闲娱乐', '日常娱乐']);
});
