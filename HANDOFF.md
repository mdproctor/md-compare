# Handover — 2026-05-19

**Branch:** `main` (clean)

## Current state

md-compare is a working Electron + Quarkus desktop app for side-by-side rendered markdown comparison. Built from scratch this session.

Core diff viewer is complete and tested. Phase 2 (LLM critique) is stubbed but not wired.

## What was built

- Electron app with Quarkus 3.34 backend (uber-JAR, dynamic port)
- `java-server.js` state machine (idle→starting→healthy→crashed→restarting→fatal)
- Three HTTP endpoints: `GET /api/file`, `GET /api/watch` (SSE), `GET /` (serves UI)
- LCS line diff → canvas minimap (red=A-side, green=B-side) + inline block markers
- Scroll sync (percentage-based), draggable divider, click-to-scroll on minimap
- Live file watch via SSE EventSource (ref-counted, shared across panels)
- 6 Java tests, 10 Playwright E2E tests passing (2 scroll tests intentionally skip when content fits viewport)

## Immediate next work

From `docs/FEATURES.md` — diff viewer completeness:

1. **Swap panels (A↔B)** — button in topbar; swap `filePaths`/`contents`, swap label values, re-run `updateDiffMap()`
2. **Next/prev diff navigation** — `n`/`p` keyboard + ↑↓ buttons; walk `lastChunks`, find annotated element, `scrollBy`
3. **Diff summary** — after `updateDiffMap()`, count chunks by op; render in topbar
4. **Word-level diff** — within changed blocks, highlight exact word-level changes (not just whole paragraph)

## References

| Context | Where |
|---|---|
| Feature backlog | `docs/FEATURES.md` |
| Architecture + run commands | `CLAUDE.md` |
| Diff algorithm | `index.html` — `lineDiff()`, `drawDiffMap()`, `annotateRendered()` |
| Java resources | `server/src/main/java/io/mdcompare/server/` |
| Playwright tests | `electron-tests/e2e/` |
| Sparge patterns (reference) | `~/claude/sparge/` — start session with `claude --add-dir /Users/mdproctor/claude/sparge` |
