// electron-tests/e2e/swap-panels.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { launchApp }    = require('./helpers');

// ── launchApp path guard ─────────────────────────────────────────────────────

test.describe('launchApp path guard', () => {
  test('throws immediately when fileA is undefined', async () => {
    await expect(launchApp(undefined, process.env.TEST_FILE_B))
      .rejects.toThrow(/undefined.*TEST_FILE_A|fileA.*undefined/i);
  });
});

// ── Both files loaded ────────────────────────────────────────────────────────

test.describe('swap panels — both files loaded', () => {
  let app, window, originalPathA, originalPathB;

  let jsErrors;

  test.beforeAll(async () => {
    ({ app, window, jsErrors } = await launchApp(process.env.TEST_FILE_A, process.env.TEST_FILE_B));
    originalPathA = await window.locator('#path-a').textContent();
    originalPathB = await window.locator('#path-b').textContent();
  });

  test.afterAll(async () => {
    if (jsErrors) expect(jsErrors).toHaveLength(0);
    if (app) await app.close();
  });

  test('swap button is enabled when both panels are loaded', async () => {
    await expect(window.locator('#btn-swap')).toBeEnabled();
  });

  test('swap reverses panel paths', async () => {
    await window.locator('#btn-swap').click();
    await expect(window.locator('#path-a')).toHaveText(originalPathB);
    await expect(window.locator('#path-b')).toHaveText(originalPathA);
    await window.locator('#btn-swap').click(); // restore
  });

  test('double-swap restores original state', async () => {
    await window.locator('#btn-swap').click();
    await window.locator('#btn-swap').click();
    await expect(window.locator('#path-a')).toHaveText(originalPathA);
    await expect(window.locator('#path-b')).toHaveText(originalPathB);
  });

  test('labels follow content after swap', async () => {
    const originalLabel = await window.locator('#label-a').inputValue();
    await window.locator('#label-a').fill('My Draft');
    await window.locator('#btn-swap').click();
    await expect(window.locator('#label-b')).toHaveValue('My Draft');
    await window.locator('#btn-swap').click(); // restore — label returns to panel A with content
    await expect(window.locator('#label-a')).toHaveValue('My Draft'); // verify round-trip
  });

  test('diff markers remain present on both sides after swap', async () => {
    await window.locator('#btn-swap').click();
    await window.waitForFunction(() => document.querySelector('[data-diff-chunk]') !== null, undefined, { timeout: 5000 });
    expect(await window.locator('#render-a .diff-del').count()).toBeGreaterThan(0);
    expect(await window.locator('#render-b .diff-ins').count()).toBeGreaterThan(0);
    await window.locator('#btn-swap').click(); // restore
  });

  test('scroll positions reset to top after swap', async () => {
    await window.evaluate(() => {
      document.getElementById('body-a').scrollTop = 200;
      document.getElementById('body-b').scrollTop = 200;
    });
    await window.locator('#btn-swap').click();
    await window.waitForFunction(
      () => document.getElementById('body-a').scrollTop === 0,
      undefined,
      { timeout: 5000 }
    );
    const scrollA = await window.evaluate(() => document.getElementById('body-a').scrollTop);
    const scrollB = await window.evaluate(() => document.getElementById('body-b').scrollTop);
    expect(scrollA).toBe(0);
    expect(scrollB).toBe(0);
    await window.locator('#btn-swap').click(); // restore
  });

  test('no JS errors occur during load and swap operations', async () => {
    if (jsErrors) expect(jsErrors).toHaveLength(0);
  });

  test('swap button is disabled when a panel path is cleared', async () => {
    // Test the disabled state without spawning a second JVM — clear panel A's path
    // programmatically, verify button disables, then restore.
    const savedPath = await window.evaluate(() => panels.a.path);
    await window.evaluate(() => { panels.a.path = null; updateSwapButton(); });
    await expect(window.locator('#btn-swap')).toBeDisabled();
    await window.evaluate(path => { panels.a.path = path; updateSwapButton(); }, savedPath);
    await expect(window.locator('#btn-swap')).toBeEnabled();
  });
});
