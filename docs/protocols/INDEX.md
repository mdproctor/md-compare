# md-compare Protocols

| File | Rule | Applies to |
|---|---|---|
| [playwright-jvm-warmup.md](playwright-jvm-warmup.md) | global-setup.js must warm the Quarkus JVM before tests | electron-tests/e2e/global-setup.js |
| [playwright-one-describe-per-spec.md](playwright-one-describe-per-spec.md) | One describe block per spec file — multiple blocks each spawn a JVM and cold-start | electron-tests/e2e/*.spec.js |
| [playwright-kill-stale-processes.md](playwright-kill-stale-processes.md) | Kill stale Electron/Quarkus processes before any test run | all Playwright E2E test runs |
| [playwright-jserrors-in-afterall.md](playwright-jserrors-in-afterall.md) | All describe blocks must destructure jsErrors and guard-assert in afterAll | electron-tests/e2e/*.spec.js |
