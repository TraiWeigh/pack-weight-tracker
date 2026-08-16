# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> adding item with qty > 1 multiplies weight in totals
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:76:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-5E85ZL -juggler-pipe -silent
<launched> pid=53538
[pid=53538][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53538][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53538][err] Couldn't load XPCOM.
[pid=53538] <process did exit: exitCode=255, signal=null>
[pid=53538] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-5E85ZL -juggler-pipe -silent
  - <launched> pid=53538
  - [pid=53538][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53538][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53538][err] Couldn't load XPCOM.
  - [pid=53538] <process did exit: exitCode=255, signal=null>
  - [pid=53538] starting temporary directories cleanup
  - [pid=53538] <gracefully close start>
  - [pid=53538] <kill>
  - [pid=53538] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53538] finished temporary directories cleanup
  - [pid=53538] <gracefully close end>

```