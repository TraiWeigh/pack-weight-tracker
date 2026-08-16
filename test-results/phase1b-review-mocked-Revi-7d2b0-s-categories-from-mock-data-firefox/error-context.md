# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/review-mocked.spec.ts >> Review page — live-locker mock >> route loads and renders categories from mock data
- Location: tests/e2e/phase1b/review-mocked.spec.ts:83:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-cDJacd -juggler-pipe -silent
<launched> pid=53598
[pid=53598][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53598][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53598][err] Couldn't load XPCOM.
[pid=53598] <process did exit: exitCode=255, signal=null>
[pid=53598] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-cDJacd -juggler-pipe -silent
  - <launched> pid=53598
  - [pid=53598][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53598][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53598][err] Couldn't load XPCOM.
  - [pid=53598] <process did exit: exitCode=255, signal=null>
  - [pid=53598] starting temporary directories cleanup
  - [pid=53598] <gracefully close start>
  - [pid=53598] <kill>
  - [pid=53598] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53598] finished temporary directories cleanup
  - [pid=53598] <gracefully close end>

```