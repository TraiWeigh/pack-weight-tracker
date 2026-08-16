# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Accessible names & tooltips >> tab order does not trap in a basic category open/close workflow
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:150:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-LZlfdX -juggler-pipe -silent
<launched> pid=53463
[pid=53463][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53463][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53463][err] Couldn't load XPCOM.
[pid=53463] <process did exit: exitCode=255, signal=null>
[pid=53463] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-LZlfdX -juggler-pipe -silent
  - <launched> pid=53463
  - [pid=53463][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53463][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53463][err] Couldn't load XPCOM.
  - [pid=53463] <process did exit: exitCode=255, signal=null>
  - [pid=53463] starting temporary directories cleanup
  - [pid=53463] <gracefully close start>
  - [pid=53463] <kill>
  - [pid=53463] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53463] finished temporary directories cleanup
  - [pid=53463] <gracefully close end>

```