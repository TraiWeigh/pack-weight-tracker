# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/review-mocked.spec.ts >> Review page — error states (mocked) >> 404 share token shows error state, no crash
- Location: tests/e2e/phase1b/review-mocked.spec.ts:213:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-DwsIS2 -juggler-pipe -silent
<launched> pid=53688
[pid=53688][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53688][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53688][err] Couldn't load XPCOM.
[pid=53688] <process did exit: exitCode=255, signal=null>
[pid=53688] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-DwsIS2 -juggler-pipe -silent
  - <launched> pid=53688
  - [pid=53688][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53688][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53688][err] Couldn't load XPCOM.
  - [pid=53688] <process did exit: exitCode=255, signal=null>
  - [pid=53688] starting temporary directories cleanup
  - [pid=53688] <gracefully close start>
  - [pid=53688] <kill>
  - [pid=53688] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53688] finished temporary directories cleanup
  - [pid=53688] <gracefully close end>

```