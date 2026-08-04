import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { makeProgressBar, shortTitle } from './console-progress.mjs';

describe('console batch progress', () => {
  it('renders start, middle and completion percentages', () => {
    assert.match(makeProgressBar(0, 4), /0\/4 0%/);
    assert.match(makeProgressBar(2, 4), /2\/4 50%/);
    assert.match(makeProgressBar(4, 4), /4\/4 100%/);
  });

  it('shortens multiline titles for a readable terminal line', () => {
    assert.equal(shortTitle('第一行\n第二行', 20), '第一行 第二行');
    assert.equal(shortTitle('123456789', 5), '12345…');
  });
});
