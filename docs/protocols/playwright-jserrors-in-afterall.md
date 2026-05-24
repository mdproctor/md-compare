---
id: PP-20260525-94aaa4
title: "All spec describe blocks must destructure jsErrors from launchApp and assert it in afterAll"
type: rule
scope: repo
applies_to: "electron-tests/e2e/*.spec.js — every test.describe that calls launchApp"
severity: important
refs:
  - electron-tests/e2e/helpers.js
violation_hint: "a describe block calls launchApp but does not destructure jsErrors, or asserts expect(jsErrors).toHaveLength(0) without the if(jsErrors) guard — either JS errors go unreported or cold-start timeouts produce spurious second failures"
created: 2026-05-25
---

Every `test.describe` block that calls `launchApp` must destructure `jsErrors` from the result and assert `if (jsErrors) expect(jsErrors).toHaveLength(0)` in `afterAll`. The `jsErrors` array collects renderer-side JavaScript errors via a `pageerror` listener attached inside `launchApp`; omitting the assertion means renderer errors pass silently. The `if (jsErrors)` guard is required because when `beforeAll` fails (e.g. JVM cold-start timeout), `launchApp` never returns and `jsErrors` remains `undefined` — an unguarded `toHaveLength` call on `undefined` throws a second, spurious error that obscures the real cold-start failure in CI output.
