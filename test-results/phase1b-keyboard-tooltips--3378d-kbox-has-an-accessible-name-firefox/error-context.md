# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Accessible names & tooltips >> item checkbox has an accessible name
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:140:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-anFYId -juggler-pipe -silent
<launched> pid=53448
[pid=53448][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53448][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53448][err] Couldn't load XPCOM.
[pid=53448] <process did exit: exitCode=255, signal=null>
[pid=53448] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-anFYId -juggler-pipe -silent
  - <launched> pid=53448
  - [pid=53448][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53448][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53448][err] Couldn't load XPCOM.
  - [pid=53448] <process did exit: exitCode=255, signal=null>
  - [pid=53448] starting temporary directories cleanup
  - [pid=53448] <gracefully close start>
  - [pid=53448] <kill>
  - [pid=53448] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53448] finished temporary directories cleanup
  - [pid=53448] <gracefully close end>

```