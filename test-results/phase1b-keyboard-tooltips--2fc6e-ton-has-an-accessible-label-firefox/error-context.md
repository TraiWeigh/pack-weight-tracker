# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Accessible names & tooltips >> category Add Item button has an accessible label
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:128:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-LcB1TF -juggler-pipe -silent
<launched> pid=53433
[pid=53433][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53433][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53433][err] Couldn't load XPCOM.
[pid=53433] <process did exit: exitCode=255, signal=null>
[pid=53433] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-LcB1TF -juggler-pipe -silent
  - <launched> pid=53433
  - [pid=53433][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53433][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53433][err] Couldn't load XPCOM.
  - [pid=53433] <process did exit: exitCode=255, signal=null>
  - [pid=53433] starting temporary directories cleanup
  - [pid=53433] <gracefully close start>
  - [pid=53433] <kill>
  - [pid=53433] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53433] finished temporary directories cleanup
  - [pid=53433] <gracefully close end>

```