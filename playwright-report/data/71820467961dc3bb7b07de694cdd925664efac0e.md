# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Accessible names & tooltips >> Print button has both aria-label and title attribute
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:105:7

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-XxhHTc -juggler-pipe -silent
<launched> pid=53403
[pid=53403][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
[pid=53403][err] libXdamage.so.1: cannot open shared object file: No such file or directory
[pid=53403][err] Couldn't load XPCOM.
[pid=53403] <process did exit: exitCode=255, signal=null>
[pid=53403] starting temporary directories cleanup
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-XxhHTc -juggler-pipe -silent
  - <launched> pid=53403
  - [pid=53403][err] XPCOMGlueLoad error for file /home/runner/workspace/.cache/ms-playwright/firefox-1538/firefox/libxul.so:
  - [pid=53403][err] libXdamage.so.1: cannot open shared object file: No such file or directory
  - [pid=53403][err] Couldn't load XPCOM.
  - [pid=53403] <process did exit: exitCode=255, signal=null>
  - [pid=53403] starting temporary directories cleanup
  - [pid=53403] <gracefully close start>
  - [pid=53403] <kill>
  - [pid=53403] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=53403] finished temporary directories cleanup
  - [pid=53403] <gracefully close end>

```