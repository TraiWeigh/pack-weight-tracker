# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> category-level weight total is displayed and non-zero when items are selected
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:26:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-gcgUSv -juggler-pipe -silent
<launched> pid=53493
[pid=53493][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53493][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53493][err] Couldn't load XPCOM.
[pid=53493] <process did exit: exitCode=255, signal=null>
[pid=53493] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-gcgUSv -juggler-pipe -silent
  - <launched> pid=53493
  - [pid=53493][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53493][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53493][err] Couldn't load XPCOM.
  - [pid=53493] <process did exit: exitCode=255, signal=null>
  - [pid=53493] starting temporary directories cleanup
  - [pid=53493] <gracefully close start>
  - [pid=53493] <kill>
  - [pid=53493] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53493] finished temporary directories cleanup
  - [pid=53493] <gracefully close end>

```