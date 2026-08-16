# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> pressing Space on a category Open button opens the category
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:31:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-8w0NN3 -juggler-pipe -silent
<launched> pid=53313
[pid=53313][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53313][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53313][err] Couldn't load XPCOM.
[pid=53313] <process did exit: exitCode=255, signal=null>
[pid=53313] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-8w0NN3 -juggler-pipe -silent
  - <launched> pid=53313
  - [pid=53313][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53313][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53313][err] Couldn't load XPCOM.
  - [pid=53313] <process did exit: exitCode=255, signal=null>
  - [pid=53313] starting temporary directories cleanup
  - [pid=53313] <gracefully close start>
  - [pid=53313] <kill>
  - [pid=53313] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53313] finished temporary directories cleanup
  - [pid=53313] <gracefully close end>

```