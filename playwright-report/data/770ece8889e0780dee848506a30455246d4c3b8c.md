# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> category open/close button is reachable via keyboard focus
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:13:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-icZZPF -juggler-pipe -silent
<launched> pid=53218
[pid=53218][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53218][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53218][err] Couldn't load XPCOM.
[pid=53218] <process did exit: exitCode=255, signal=null>
[pid=53218] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-icZZPF -juggler-pipe -silent
  - <launched> pid=53218
  - [pid=53218][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53218][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53218][err] Couldn't load XPCOM.
  - [pid=53218] <process did exit: exitCode=255, signal=null>
  - [pid=53218] starting temporary directories cleanup
  - [pid=53218] <gracefully close start>
  - [pid=53218] <kill>
  - [pid=53218] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53218] finished temporary directories cleanup
  - [pid=53218] <gracefully close end>

```