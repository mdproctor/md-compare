// electron-tests/e2e/diff-summary.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { launchApp }    = require('./helpers');

test.describe('diff summary', () => {
  let app, window, originalContentB;

  test.beforeAll(async () => {
    ({ app, window } = await launchApp(process.env.TEST_FILE_A, process.env.TEST_FILE_B));
    originalContentB = await window.evaluate(() => panels.b.content);
  });

  test.afterAll(async () => { if (app) await app.close(); });

  test('summary shows breakdown after loading differing files', async () => {
    const text = await window.evaluate(() => document.getElementById('diff-summary').textContent);
    expect(text).toMatch(/[~−+]\d/);
  });

  test('summary has tooltip attribute when non-empty', async () => {
    const tooltip = await window.evaluate(() => document.getElementById('diff-summary').dataset.tooltip);
    expect(tooltip).toContain('modified');
  });

  test('summary clears when files are identical', async () => {
    await window.evaluate(() => { panels.b.content = panels.a.content; updateDiffMap(); });
    const text = await window.evaluate(() => document.getElementById('diff-summary').textContent);
    expect(text).toBe('');
    const tooltip = await window.evaluate(() => document.getElementById('diff-summary').dataset.tooltip);
    expect(tooltip).toBe('');
    // Restore
    await window.evaluate(c => { panels.b.content = c; updateDiffMap(); }, originalContentB);
  });

  test('summary total chunk count is preserved after swap', async () => {
    const before = await window.evaluate(() => document.getElementById('diff-summary').textContent);
    await window.evaluate(() => swapPanels());
    const after = await window.evaluate(() => document.getElementById('diff-summary').textContent);
    const sum = s => (s.match(/\d+/g) || []).reduce((a, b) => a + +b, 0);
    expect(sum(after)).toBe(sum(before));
    // Restore
    await window.evaluate(() => swapPanels());
  });
});
