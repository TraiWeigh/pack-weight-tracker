# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/review-mocked.spec.ts >> Review page — live-locker mock >> weight summary (LIST SUMMARY) renders without NaN/Infinity
- Location: tests/e2e/phase1b/review-mocked.spec.ts:127:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-Uwc3wY -juggler-pipe -silent
<launched> pid=53628
[pid=53628][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53628][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53628][err] Couldn't load XPCOM.
[pid=53628] <process did exit: exitCode=255, signal=null>
[pid=53628] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-Uwc3wY -juggler-pipe -silent
  - <launched> pid=53628
  - [pid=53628][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53628][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53628][err] Couldn't load XPCOM.
  - [pid=53628] <process did exit: exitCode=255, signal=null>
  - [pid=53628] starting temporary directories cleanup
  - [pid=53628] <gracefully close start>
  - [pid=53628] <kill>
  - [pid=53628] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53628] finished temporary directories cleanup
  - [pid=53628] <gracefully close end>

```