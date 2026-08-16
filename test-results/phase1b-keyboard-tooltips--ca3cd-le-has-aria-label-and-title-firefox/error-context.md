# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Accessible names & tooltips >> Drag-to-reorder handle has aria-label and title
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:119:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-8Rn0Cm -juggler-pipe -silent
<launched> pid=53418
[pid=53418][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53418][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53418][err] Couldn't load XPCOM.
[pid=53418] <process did exit: exitCode=255, signal=null>
[pid=53418] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-8Rn0Cm -juggler-pipe -silent
  - <launched> pid=53418
  - [pid=53418][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53418][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53418][err] Couldn't load XPCOM.
  - [pid=53418] <process did exit: exitCode=255, signal=null>
  - [pid=53418] starting temporary directories cleanup
  - [pid=53418] <gracefully close start>
  - [pid=53418] <kill>
  - [pid=53418] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53418] finished temporary directories cleanup
  - [pid=53418] <gracefully close end>

```