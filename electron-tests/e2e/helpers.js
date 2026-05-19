// electron-tests/e2e/helpers.js
'use strict';
const { _electron: electron } = require('playwright');
const path = require('path');

// Use Sparge's Electron binary since md-compare shares the same version
const ELECTRON_BIN = process.env.ELECTRON_BIN ||
  '/Users/mdproctor/claude/sparge/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

const APP_PATH = path.join(__dirname, '..', '..');

async function launchApp(fileA, fileB) {
  const args = [APP_PATH];
  if (fileA) args.push(fileA);
  if (fileB) args.push(fileB);
  const app    = await electron.launch({ executablePath: ELECTRON_BIN, args });
  const window = await app.firstWindow();
  // Wait for both panels to render their content.
  // render-a and render-b gain an h1 when the markdown is parsed.
  await window.waitForFunction(
    () => document.querySelector('#render-a h1') !== null,
    { timeout: 55_000 }
  );
  await window.waitForFunction(
    () => document.querySelector('#render-b h1') !== null,
    { timeout: 55_000 }
  );
  return { app, window };
}

module.exports = { launchApp };
