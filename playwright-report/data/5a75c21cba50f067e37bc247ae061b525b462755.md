# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> Escape cancels Add Category input
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:62:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-5XGyJq -juggler-pipe -silent
<launched> pid=53358
[pid=53358][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53358][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53358][err] Couldn't load XPCOM.
[pid=53358] <process did exit: exitCode=255, signal=null>
[pid=53358] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-5XGyJq -juggler-pipe -silent
  - <launched> pid=53358
  - [pid=53358][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53358][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53358][err] Couldn't load XPCOM.
  - [pid=53358] <process did exit: exitCode=255, signal=null>
  - [pid=53358] starting temporary directories cleanup
  - [pid=53358] <gracefully close start>
  - [pid=53358] <kill>
  - [pid=53358] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53358] finished temporary directories cleanup
  - [pid=53358] <gracefully close end>

```