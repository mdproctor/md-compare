---
id: PP-20260525-e3befb
title: "Each Playwright spec file must have exactly one describe block with one JVM launch"
type: rule
scope: repo
applies_to: "electron-tests/e2e/*.spec.js"
severity: important
refs:
  - electron-tests/e2e/diff-summary.spec.js
  - electron-tests/e2e/word-diff.spec.js
violation_hint: "a spec file has two or more test.describe blocks each with their own beforeAll/afterAll; the second describe's JVM launch cold-starts and times out at 180s"
created: 2026-05-25
---

Each Playwright spec file must contain exactly one `test.describe` block with a single `beforeAll`/`afterAll` pair that calls `launchApp`. Multiple describe blocks in the same file each spawn a separate JVM instance; because the JVM cold-starts after the previous instance closes, the second launch regularly exceeds the 180s `beforeAll` timeout on resource-constrained machines. When adding unit-level or edge-case tests that share the same app state, add them as additional `test(...)` calls inside the existing describe block rather than opening a second describe with its own launch.
