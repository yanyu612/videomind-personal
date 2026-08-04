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
