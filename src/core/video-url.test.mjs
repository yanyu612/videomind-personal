import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeVideoUrl } from './video-url.mjs';

test('normalizes Douyin modal URLs from favorites and likes to one work ID', () => {
  const favorites = 'https://www.douyin.com/user/self?from_tab_name=main&modal_id=7667897651131731236&showTab=favorite_collection';
  const likes = 'https://www.douyin.com/user/self?modal_id=7667897651131731236&showTab=like';
  assert.equal(canonicalizeVideoUrl(favorites), 'https://www.douyin.com/video/7667897651131731236');
  assert.equal(canonicalizeVideoUrl(likes), canonicalizeVideoUrl(favorites));
});

test('strips changing query parameters from direct Douyin works', () => {
  assert.equal(
    canonicalizeVideoUrl('https://www.douyin.com/video/123456?previous_page=web_code_link'),
    'https://www.douyin.com/video/123456'
  );
  assert.equal(canonicalizeVideoUrl('https://www.douyin.com/note/987?a=1'), 'https://www.douyin.com/note/987');
});

test('leaves non-Douyin URLs usable', () => {
  assert.equal(canonicalizeVideoUrl('https://example.com/a?x=1#part'), 'https://example.com/a?x=1');
});
