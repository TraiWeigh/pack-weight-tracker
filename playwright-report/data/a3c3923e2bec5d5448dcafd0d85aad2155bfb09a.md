# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/review-mocked.spec.ts >> Review page — error states (mocked) >> invalid / empty token route shows error state
- Location: tests/e2e/phase1b/review-mocked.spec.ts:235:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-OWscpl -juggler-pipe -silent
<launched> pid=53718
[pid=53718][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53718][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53718][err] Couldn't load XPCOM.
[pid=53718] <process did exit: exitCode=255, signal=null>
[pid=53718] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-OWscpl -juggler-pipe -silent
  - <launched> pid=53718
  - [pid=53718][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53718][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53718][err] Couldn't load XPCOM.
  - [pid=53718] <process did exit: exitCode=255, signal=null>
  - [pid=53718] starting temporary directories cleanup
  - [pid=53718] <gracefully close start>
  - [pid=53718] <kill>
  - [pid=53718] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53718] finished temporary directories cleanup
  - [pid=53718] <gracefully close end>

```