# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> unit switch imperial→metric changes displayed weights (not zero, not NaN)
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:35:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-WrOG9L -juggler-pipe -silent
<launched> pid=53508
[pid=53508][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53508][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53508][err] Couldn't load XPCOM.
[pid=53508] <process did exit: exitCode=255, signal=null>
[pid=53508] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-WrOG9L -juggler-pipe -silent
  - <launched> pid=53508
  - [pid=53508][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53508][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53508][err] Couldn't load XPCOM.
  - [pid=53508] <process did exit: exitCode=255, signal=null>
  - [pid=53508] starting temporary directories cleanup
  - [pid=53508] <gracefully close start>
  - [pid=53508] <kill>
  - [pid=53508] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53508] finished temporary directories cleanup
  - [pid=53508] <gracefully close end>

```