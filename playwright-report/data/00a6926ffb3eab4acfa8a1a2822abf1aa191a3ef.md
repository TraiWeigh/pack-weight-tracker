# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/review-mocked.spec.ts >> Review page — live-locker mock >> local Review sandbox edits do NOT invoke owner Locker API
- Location: tests/e2e/phase1b/review-mocked.spec.ts:137:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-fSFExk -juggler-pipe -silent
<launched> pid=53643
[pid=53643][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53643][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53643][err] Couldn't load XPCOM.
[pid=53643] <process did exit: exitCode=255, signal=null>
[pid=53643] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-fSFExk -juggler-pipe -silent
  - <launched> pid=53643
  - [pid=53643][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53643][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53643][err] Couldn't load XPCOM.
  - [pid=53643] <process did exit: exitCode=255, signal=null>
  - [pid=53643] starting temporary directories cleanup
  - [pid=53643] <gracefully close start>
  - [pid=53643] <kill>
  - [pid=53643] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53643] finished temporary directories cleanup
  - [pid=53643] <gracefully close end>

```