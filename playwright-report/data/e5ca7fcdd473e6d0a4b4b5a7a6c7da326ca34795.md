# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> pressing Enter on item expand-details opens item detail panel
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:50:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-CMYDcy -juggler-pipe -silent
<launched> pid=53343
[pid=53343][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53343][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53343][err] Couldn't load XPCOM.
[pid=53343] <process did exit: exitCode=255, signal=null>
[pid=53343] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-CMYDcy -juggler-pipe -silent
  - <launched> pid=53343
  - [pid=53343][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53343][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53343][err] Couldn't load XPCOM.
  - [pid=53343] <process did exit: exitCode=255, signal=null>
  - [pid=53343] starting temporary directories cleanup
  - [pid=53343] <gracefully close start>
  - [pid=53343] <kill>
  - [pid=53343] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53343] finished temporary directories cleanup
  - [pid=53343] <gracefully close end>

```