---
id: PP-20260525-7d23ad
title: "Kill stale Electron/Quarkus processes before starting a Playwright test run"
type: rule
scope: repo
applies_to: "all Playwright E2E test runs — electron-tests/"
severity: important
refs:
  - electron-tests/e2e/global-setup.js
  - CLAUDE.md#testing
violation_hint: "global-setup fails with 'Target page, context or browser has been closed' despite the fixture files being present and no code changes — a stale Electron process from a previous cancelled run is holding the CDP debug port"
created: 2026-05-25
---

Before starting any md-compare Playwright test run, kill all stale Electron and Quarkus processes with `pkill -9 -f "Electron|mdcompare|quarkus" 2>/dev/null`. When a Playwright run is cancelled (Ctrl+C or programmatic stop), the Electron process can remain alive with its CDP debug port open. The next `electron.launch()` call in global-setup may connect to the stale process, which then closes unexpectedly and produces "Target page, context or browser has been closed" — appearing to be a code or fixture issue when it is actually a leftover process. The kill command is safe to run even when no stale processes exist; the `2>/dev/null` suppresses the "no process found" warning.
