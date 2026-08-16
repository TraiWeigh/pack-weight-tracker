# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> Enter confirms Add Category input
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:75:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-5fUU7M -juggler-pipe -silent
<launched> pid=53373
[pid=53373][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53373][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53373][err] Couldn't load XPCOM.
[pid=53373] <process did exit: exitCode=255, signal=null>
[pid=53373] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-5fUU7M -juggler-pipe -silent
  - <launched> pid=53373
  - [pid=53373][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53373][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53373][err] Couldn't load XPCOM.
  - [pid=53373] <process did exit: exitCode=255, signal=null>
  - [pid=53373] starting temporary directories cleanup
  - [pid=53373] <gracefully close start>
  - [pid=53373] <kill>
  - [pid=53373] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53373] finished temporary directories cleanup
  - [pid=53373] <gracefully close end>

```