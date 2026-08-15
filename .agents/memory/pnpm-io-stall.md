---
name: pnpm/npm I/O stall wedge
description: How to recognize and recover when every pnpm/npm command freezes in D-state
---

Symptom: `pnpm --version`, `npm view`, `curl` to npm registry, and even `tail` on a log file all hang forever; `ps` shows them in `D` (uninterruptible disk sleep) with 0% CPU; load average climbs past 10 while nothing computes.

**Why:** A storage/FUSE layer used by the pnpm store / cache path wedges. D-state processes are unkillable (`kill -9` has no effect) and every new pnpm/npm invocation joins the frozen queue. Basic shell, `node --version`, and workspace file reads still work, which makes it look intermittent.

**How to apply:** Do NOT retry installs — each retry adds another stuck process. Verify no workspace files were modified (`git diff`), then ask the user to restart the workspace/Repl VM; that is the only fix. After restart, confirm `pnpm --version` returns instantly before re-running the install.

Also: `npm view <big-pkg>` can time out purely from packument size; fetch `https://registry.npmjs.org/-/package/<name>/dist-tags` (tiny) for the latest version, and stream-search the packument with Node fetch for publish dates.
