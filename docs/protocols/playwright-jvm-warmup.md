---
id: PP-20260522-ef1eab
title: "global-setup.js must launch and close Electron+Quarkus once before tests to warm the JVM"
type: rule
scope: repo
applies_to: "electron-tests/e2e/global-setup.js — all Playwright test suites"
severity: important
refs:
  - electron-tests/e2e/global-setup.js
  - CLAUDE.md#testing
violation_hint: "global-setup.js does not call electron.launch() before writing fixture files; cold-start JVM timeouts appear on any full suite run after machine restart or long inactivity"
created: 2026-05-22
---

Each Playwright spec file launches its own Electron+Quarkus instance via `launchApp()`. On a machine with many JVM processes running (e.g. IntelliJ), the Quarkus JAR cold-start can take 2–3 minutes — exceeding the 180s `beforeAll` timeout. The `global-setup.js` fixture therefore launches the full app once (with both test fixture files), waits for both panels to render (confirming the JAR started), then closes it. This pre-loads the JAR bytecode into the OS page cache so subsequent JVM starts in each spec's `beforeAll` complete in under 10 seconds. Do not remove or simplify this warmup; it is not redundant with the spec-level `launchApp()` calls — it serves a different purpose (cache priming vs test execution). Tracked in issue #6 for a structural fix (shared JVM across all specs).
