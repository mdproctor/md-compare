// electron-tests/e2e/word-diff.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { launchApp }    = require('./helpers');

test.describe('word-level diff', () => {
  let app, window, jsErrors, originalContentB;

  test.beforeAll(async () => {
    ({ app, window, jsErrors } = await launchApp(process.env.TEST_FILE_A, process.env.TEST_FILE_B));
    originalContentB = await window.evaluate(() => panels.b.content);
  });

  test.afterAll(async () => {
    expect(jsErrors).toHaveLength(0);
    if (app) await app.close();
  });

  test('changed words are highlighted in mod chunk elements', async () => {
    const count = await window.evaluate(() =>
      document.querySelectorAll('#render-a mark.diff-word-a').length
    );
    expect(count).toBeGreaterThan(0);
  });

  test('unchanged words within changed blocks have no mark', async () => {
    const hasUnmarked = await window.evaluate(() => {
      const walker = document.createTreeWalker(
        document.getElementById('render-a'), 4 // NodeFilter.SHOW_TEXT
      );
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentNode.tagName !== 'MARK' && node.data.trim().length > 0) return true;
      }
      return false;
    });
    expect(hasUnmarked).toBe(true);
  });

  test('pre blocks have no word highlights', async () => {
    const count = await window.evaluate(() =>
      document.querySelectorAll('#render-a pre mark, #render-b pre mark').length
    );
    expect(count).toBe(0);
  });

  test('word highlights appear on both panels for mod chunks', async () => {
    const countB = await window.evaluate(() =>
      document.querySelectorAll('#render-b mark.diff-word-b').length
    );
    expect(countB).toBeGreaterThan(0);
  });

  test('word highlights persist and update correctly after swap', async () => {
    await window.evaluate(() => swapPanels());
    const countA = await window.evaluate(() =>
      document.querySelectorAll('#render-a mark.diff-word-a').length
    );
    const countB = await window.evaluate(() =>
      document.querySelectorAll('#render-b mark.diff-word-b').length
    );
    expect(countA).toBeGreaterThan(0);
    expect(countB).toBeGreaterThan(0);
    await window.evaluate(() => swapPanels()); // restore
  });
});
