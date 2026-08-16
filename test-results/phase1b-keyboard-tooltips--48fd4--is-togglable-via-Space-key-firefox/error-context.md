# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> item checkbox is togglable via Space key
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:88:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-6kM5Zn -juggler-pipe -silent
<launched> pid=53388
[pid=53388][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53388][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53388][err] Couldn't load XPCOM.
[pid=53388] <process did exit: exitCode=255, signal=null>
[pid=53388] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-6kM5Zn -juggler-pipe -silent
  - <launched> pid=53388
  - [pid=53388][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53388][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53388][err] Couldn't load XPCOM.
  - [pid=53388] <process did exit: exitCode=255, signal=null>
  - [pid=53388] starting temporary directories cleanup
  - [pid=53388] <gracefully close start>
  - [pid=53388] <kill>
  - [pid=53388] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53388] finished temporary directories cleanup
  - [pid=53388] <gracefully close end>

```