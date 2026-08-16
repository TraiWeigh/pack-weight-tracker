# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/review-mocked.spec.ts >> Review page — live-locker mock >> Review CASE B — same sourceVersion preserves reviewer local state
- Location: tests/e2e/phase1b/review-mocked.spec.ts:171:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-OE6UqU -juggler-pipe -silent
<launched> pid=53673
[pid=53673][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53673][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53673][err] Couldn't load XPCOM.
[pid=53673] <process did exit: exitCode=255, signal=null>
[pid=53673] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-OE6UqU -juggler-pipe -silent
  - <launched> pid=53673
  - [pid=53673][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53673][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53673][err] Couldn't load XPCOM.
  - [pid=53673] <process did exit: exitCode=255, signal=null>
  - [pid=53673] starting temporary directories cleanup
  - [pid=53673] <gracefully close start>
  - [pid=53673] <kill>
  - [pid=53673] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53673] finished temporary directories cleanup
  - [pid=53673] <gracefully close end>

```