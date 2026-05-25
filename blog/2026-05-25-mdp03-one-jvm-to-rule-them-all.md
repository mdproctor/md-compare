# One JVM to rule them all — eliminating cold-start flakiness

**Date:** 2026-05-25

The Playwright suite had 7 spec files, each launching its own Electron instance,
each spawning a Quarkus JVM. That's 8 JVM cold starts per run (7 specs + 1 warmup
in global-setup). On a busy machine, the 3rd or 4th consecutive cold start would
exceed the 180-second `beforeAll` timeout. The suite was flaky by design.

The existing mitigation — a warmup launch in global-setup to prime the OS page
cache — softened the problem but didn't solve it. Every spec still paid the full
JVM startup cost.

The fix: start Quarkus once in `global-setup.js` and share it across all specs.
Each spec still gets its own fresh Electron window for DOM isolation, but no spec
spawns a JVM. The Quarkus server is fully stateless — `FileResource` is a pure
read, `WatchResource` is connection-scoped SSE, `PingResource` returns a constant,
`UiResource` serves static files. Multiple Electron windows pointing at the same
port don't interfere.

The env-var forwarding chain: `global-setup.js` sets `TEST_QUARKUS_PORT` →
`helpers.js` forwards it as `QUARKUS_PORT` to the Electron env → `main.js` checks
for `QUARKUS_PORT` and skips its internal `JavaServer` spawn.

Code review caught an orphan-process risk in the first implementation: `JavaServer`
was local-scoped in global-setup, and teardown killed the process by raw PID. But
`JavaServer` has restart logic — if Quarkus crashed mid-suite, the process manager
would spawn a replacement while teardown still held the original PID. Fix:
module-scope the server instance, export a `getServer()` accessor, and have teardown
call `killServer()` through the process manager instead of raw `process.kill()`.

Result: 8 JVM launches → 1. Suite time: ~10 seconds, passes on first attempt every
time. Zero spec files modified.
