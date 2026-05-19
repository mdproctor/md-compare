// electron-tests/e2e/happy-path.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { launchApp }    = require('./helpers');

// Wrap all tests in a describe block so beforeAll/afterAll run exactly once
// for the entire suite rather than per-test (Playwright scoping requirement).
test.describe('happy path', () => {
  let app, window;

  test.beforeAll(async () => {
    ({ app, window } = await launchApp(
      process.env.TEST_FILE_A,
      process.env.TEST_FILE_B
    ));
  });

  test.afterAll(async () => { if (app) await app.close(); });

  test('app launches — window visible, no JS errors', async () => {
    const errors = [];
    window.on('pageerror', e => errors.push(e.message));
    await expect(window.locator('#topbar')).toBeVisible();
    await expect(window.locator('#logo')).toContainText('md-compare');
    expect(errors).toHaveLength(0);
  });

  test('panel A renders the heading from file A', async () => {
    await expect(window.locator('#render-a h1')).toContainText('Rule Engines');
  });

  test('panel B renders the heading from file B', async () => {
    await expect(window.locator('#render-b h1')).toContainText('Rule Engines');
  });

  test('both panels render code blocks', async () => {
    await expect(window.locator('#render-a pre')).toBeVisible();
    await expect(window.locator('#render-b pre')).toBeVisible();
  });

  test('diff markers appear in panel A for changed sections', async () => {
    const count = await window.locator('#render-a .diff-del').count();
    expect(count).toBeGreaterThan(0);
  });

  test('diff markers appear in panel B for changed sections', async () => {
    const count = await window.locator('#render-b .diff-ins').count();
    expect(count).toBeGreaterThan(0);
  });

  test('diff minimap canvas has coloured segments', async () => {
    const hasColor = await window.evaluate(() => {
      const canvas = document.getElementById('diff-map');
      const ctx    = canvas.getContext('2d');
      const h = canvas.height;
      for (let y = 0; y < h; y += 4) {
        const px = ctx.getImageData(2, y, 1, 1).data;
        if (px[0] > 200 && px[1] < 100) return true;
      }
      return false;
    });
    expect(hasColor).toBe(true);
  });

  test('sync toggle button is active by default', async () => {
    await expect(window.locator('#btn-sync')).toHaveClass(/active/);
  });
});
