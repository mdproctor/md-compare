// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir:      './electron-tests/e2e',
  globalSetup:  './electron-tests/e2e/global-setup.js',
  timeout:      60_000,
  retries:      0,
  use: { headless: false },
});
