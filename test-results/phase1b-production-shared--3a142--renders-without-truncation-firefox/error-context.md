# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> decimal weight (e.g. 1.4 oz) renders without truncation
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:114:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-aacn0C -juggler-pipe -silent
<launched> pid=53568
[pid=53568][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53568][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53568][err] Couldn't load XPCOM.
[pid=53568] <process did exit: exitCode=255, signal=null>
[pid=53568] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-aacn0C -juggler-pipe -silent
  - <launched> pid=53568
  - [pid=53568][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53568][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53568][err] Couldn't load XPCOM.
  - [pid=53568] <process did exit: exitCode=255, signal=null>
  - [pid=53568] starting temporary directories cleanup
  - [pid=53568] <gracefully close start>
  - [pid=53568] <kill>
  - [pid=53568] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53568] finished temporary directories cleanup
  - [pid=53568] <gracefully close end>

```