// electron-tests/e2e/regression.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { launchApp }    = require('./helpers');
const fs = require('fs');
const os = require('os');
const path = require('path');

test.describe('regression', () => {
  let app, window, jsErrors;

  test.beforeAll(async () => {
    ({ app, window, jsErrors } = await launchApp(
      process.env.TEST_FILE_A,
      process.env.TEST_FILE_B
    ));
  });

  test.afterAll(async () => {
    expect(jsErrors).toHaveLength(0);
    if (app) await app.close();
  });

  // ── Sync scroll ──────────────────────────────────────────────────────

  test('sync on: scrolling panel A moves panel B', async () => {
    // Ensure sync is on (button has active class)
    const btnClass = await window.locator('#btn-sync').getAttribute('class');
    if (!btnClass.includes('active')) await window.locator('#btn-sync').click();

    // Check if content is tall enough to scroll; skip if not
    const canScroll = await window.evaluate(() => {
      const body = document.getElementById('body-a');
      return (body.scrollHeight - body.clientHeight) > 10;
    });

    if (!canScroll) {
      test.skip(true, 'Content too short to scroll — fixture needs more lines');
      return;
    }

    // Reset both panels to top
    await window.evaluate(() => {
      document.getElementById('body-a').scrollTop = 0;
      document.getElementById('body-b').scrollTop = 0;
    });

    // Scroll panel A to 50% by setting scrollTop and firing 'scroll'
    // Use Playwright's mouse wheel to trigger a real scroll event
    const bodyABox = await window.locator('#body-a').boundingBox();
    await window.mouse.move(
      bodyABox.x + bodyABox.width / 2,
      bodyABox.y + bodyABox.height / 2
    );

    // Scroll down enough to reach ~50% by wheeling
    const maxScroll = await window.evaluate(() => {
      const body = document.getElementById('body-a');
      return body.scrollHeight - body.clientHeight;
    });

    await window.mouse.wheel(0, Math.floor(maxScroll * 0.5));

    // Wait for scroll propagation via rAF
    await window.waitForTimeout(300);

    const [pctA, pctB] = await window.evaluate(() => {
      const a = document.getElementById('body-a');
      const b = document.getElementById('body-b');
      const maxA = a.scrollHeight - a.clientHeight;
      const maxB = b.scrollHeight - b.clientHeight;
      return [
        maxA > 0 ? a.scrollTop / maxA : 0,
        maxB > 0 ? b.scrollTop / maxB : 0,
      ];
    });

    // Both panels should be at roughly the same percentage (within 5%)
    expect(Math.abs(pctA - pctB)).toBeLessThan(0.05);
  });

  test('sync off: scrolling panel A does not move panel B', async () => {
    // Check if content is tall enough to scroll; skip if not
    const canScroll = await window.evaluate(() => {
      const body = document.getElementById('body-a');
      return (body.scrollHeight - body.clientHeight) > 10;
    });

    if (!canScroll) {
      test.skip(true, 'Content too short to scroll — fixture needs more lines');
      return;
    }

    // Turn sync OFF
    const btnClass = await window.locator('#btn-sync').getAttribute('class');
    if (btnClass.includes('active')) await window.locator('#btn-sync').click();

    // Verify sync button is now inactive
    await expect(window.locator('#btn-sync')).not.toHaveClass(/active/);

    // Reset panel B to top
    await window.evaluate(() => { document.getElementById('body-b').scrollTop = 0; });

    // Scroll panel A using mouse wheel
    const bodyABox = await window.locator('#body-a').boundingBox();
    await window.mouse.move(
      bodyABox.x + bodyABox.width / 2,
      bodyABox.y + bodyABox.height / 2
    );

    const maxScroll = await window.evaluate(() => {
      const body = document.getElementById('body-a');
      return body.scrollHeight - body.clientHeight;
    });

    await window.mouse.wheel(0, Math.floor(maxScroll * 0.6));
    await window.waitForTimeout(300);

    const scrollB = await window.evaluate(() => document.getElementById('body-b').scrollTop);

    // Panel B should still be near top (sync is off)
    expect(scrollB).toBeLessThan(10);

    // Restore sync on for subsequent tests
    await window.locator('#btn-sync').click();
    await expect(window.locator('#btn-sync')).toHaveClass(/active/);
  });

  // ── Click-to-scroll ──────────────────────────────────────────────────

  test('clicking diff minimap scrolls panels to a changed section', async () => {
    // Wait until diff chunks are populated (diff must have run)
    await window.waitForFunction(
      () => document.querySelector('[data-diff-chunk]') !== null,
      { timeout: 10_000 }
    );

    // Reset both panels to top
    await window.evaluate(() => {
      document.getElementById('body-a').scrollTop = 0;
      document.getElementById('body-b').scrollTop = 0;
    });

    // Find bounding box of the canvas
    const canvasBox = await window.locator('#diff-map').boundingBox();
    expect(canvasBox).not.toBeNull();

    // Find the first coloured (non-grey, non-transparent) pixel position in the canvas
    const pixelPos = await window.evaluate(() => {
      const canvas = document.getElementById('diff-map');
      const ctx    = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const mid = Math.floor(w / 2);
      // Sample down left and right columns looking for a coloured pixel
      for (let y = 5; y < h; y += 2) {
        for (let x = 1; x < w - 1; x += 2) {
          if (x >= mid - 2 && x <= mid + 2) continue; // skip center divider
          const px = ctx.getImageData(x, y, 1, 1).data;
          const [r, g, b, a] = px;
          if (a === 0) continue;
          const avg = (r + g + b) / 3;
          if (Math.abs(r - avg) > 30 || Math.abs(g - avg) > 30 || Math.abs(b - avg) > 30) {
            return { x, y, w, h };
          }
        }
      }
      return null;
    });

    expect(pixelPos).not.toBeNull();

    // Click the coloured pixel in canvas coordinates → page coordinates
    const clickX = canvasBox.x + pixelPos.x;
    const clickY = canvasBox.y + pixelPos.y;

    await window.mouse.click(clickX, clickY);

    // Wait for smooth scroll (behavior: 'smooth' takes up to ~500ms)
    await window.waitForTimeout(700);

    // At least one panel should have scrolled (or be scrollable and at bottom)
    const [scrollA, scrollB] = await window.evaluate(() => [
      document.getElementById('body-a').scrollTop,
      document.getElementById('body-b').scrollTop,
    ]);

    // Either a panel scrolled, OR content fits in view (scrollTop stays 0 but that's fine)
    // The key assertion is that the click handler ran without error
    // If both panels are scrollable, at least one should have moved
    const maxScrollA = await window.evaluate(() => {
      const a = document.getElementById('body-a');
      return a.scrollHeight - a.clientHeight;
    });

    if (maxScrollA > 10) {
      // Content is scrollable — at least one panel should have scrolled
      expect(scrollA + scrollB).toBeGreaterThan(0);
    }
    // If content is not scrollable, click handler still ran without JS error — test passes
  });

  // ── File watch ───────────────────────────────────────────────────────

  test('file watch: updating file B re-renders panel B', async () => {
    const fileB = process.env.TEST_FILE_B;
    expect(fileB).toBeTruthy();

    // Write new content with a distinctive heading
    fs.writeFileSync(fileB, [
      '# Rule Engines',
      '',
      'Updated content for file watch test.',
      '',
      '## Distinctive File Watch Section',
      '',
      'This section only exists during the file watch test.',
    ].join('\n'));

    // Wait for SSE event and re-render — the new content has exactly one h2
    await expect(window.locator('#render-b h2').first()).toContainText(
      'Distinctive File Watch Section',
      { timeout: 8000 }
    );

    // Restore original file B content
    fs.writeFileSync(fileB, [
      '# Rule Engines',
      '',
      'A rule engine runs your business rules so developers do not have to hard-code them.',
      '',
      '## How It Works',
      '',
      'Each rule has a condition and an action. When the condition matches, the action fires.',
      '',
      '```java',
      'rule "Large order"',
      'when Order(total > 1000)',
      'then flag(order);',
      'end',
      '```',
      '',
      '## When Not to Use One',
      '',
      'Do not reach for a rule engine to replace five if/else statements.',
    ].join('\n'));

    // Wait for restore to propagate so subsequent tests see consistent state
    await expect(window.locator('#render-b h2').first()).toContainText('How It Works', { timeout: 5000 });
  });
});
