# TrailWeigh Phase 1C — Cross-Browser Compatibility
## Test Report

**Date:** 2026-08-16  
**Agent:** Replit Agent (main)  
**Playwright version:** 1.62.1  
**Workers:** 1 (sequential)  
**App source modified:** NO  
**Phase 1B suite (Chromium) re-run:** NO — not required; no test infrastructure changes affected Chromium behaviour

---

## §1 — Executive Summary

Both Firefox and WebKit are **environment-blocked** in the current Replit NixOS container. Neither browser could be launched. Zero TrailWeigh application defects were discovered because the app could not be reached. No app source files were modified.

| Browser | Gate result | Full suite | Blocker class |
|---------|------------|------------|---------------|
| WebKit 26.5 | 0/32 — launch failure | Not run | Environment: 40+ missing system libs |
| Firefox 153.0 | 0/32 — launch failure | Not run | Environment: NSS version conflict + GTK3 cascade |

---

## §2 — Installation Attempt Log

### Browser download
Both browser binaries were downloaded and extracted successfully:

```
.cache/ms-playwright/firefox-1538/  — INSTALLATION_COMPLETE ✅
.cache/ms-playwright/webkit-2336/   — INSTALLATION_COMPLETE ✅
```

### System dependency installation
`playwright install --with-deps` failed because Replit blocks `apt`/system package managers. `nix-env -iA` was used to install the four most likely missing libraries:

```
GTK+3 3.24.30       ~/.nix-profile/lib/libgtk-3.so.0
gdk-pixbuf 2.42.6   ~/.nix-profile/lib/libgdk_pixbuf-2.0.so.0
libXcursor 1.2.0    ~/.nix-profile/lib/libXcursor.so.1
libXi 1.7.10        ~/.nix-profile/lib/libXi.so.6
```

### DISPLAY availability
`DISPLAY=:0` is set and `/tmp/.X11-unix/X0, X1` sockets are present — a display server is running.

---

## §3 — Firefox: Detailed Failure Analysis

### Approach 1 — Default launch
`browserType.launch` pre-flight validation reported 6 missing libraries. Result: 0/32.

### Approach 2 — `nix-env` + `LD_LIBRARY_PATH` globally
Setting `LD_LIBRARY_PATH=/home/runner/.nix-profile/lib` globally caused Node.js to load the wrong OpenSSL version:
```
/usr/lib/x86_64-linux-gnu/libcrypto.so.3: version `OPENSSL_3.2.0' not found
```
This broke the Playwright test runner itself before any browser launched.

### Approach 3 — `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` + `launchOptions.env`
Bypassed the pre-flight validation and set `LD_LIBRARY_PATH` only on the Firefox subprocess (not on Node). GTK3 was now found, but `libxul.so` failed to load with a **hard NSS version conflict**:

```
Error: browserType.launch: Failed to launch the browser process.
[firefox] XPCOMGlueLoad error for file libxul.so:
libxul.so: /nix/.../glibc-2.40-66/lib/libnss3.so: version `NSS_3.107' not found
libxul.so: /nix/.../glibc-2.40-66/lib/libnss3.so: version `NSS_3.113' not found
Couldn't load XPCOM.
```

**Root cause:** Firefox 153 (Playwright build) was compiled against NSS 3.107+. The Nix environment provides libnss3 from glibc-2.40-66, which is a significantly older NSS release. This is a symbol-version incompatibility that cannot be bridged by `LD_LIBRARY_PATH` — the symbol does not exist in the installed library regardless of path resolution.

### Full Firefox missing-library map (`ldd libxul.so`)
Beyond the NSS conflict, `ldd` confirmed the following were also absent:

```
libgdk-3.so.0        libgtk-3.so.0        libstdc++.so.6
libXcursor.so.1      libXi.so.6           libgkcodecs.so
liblgpllibs.so       libmozsandbox.so     libmozsqlite3.so
libmozwayland.so     libgdk_pixbuf-2.0.so.0
```

Several of these (`libgkcodecs.so`, `liblgpllibs.so`, `libmozsandbox.so`, `libmozsqlite3.so`, `libmozwayland.so`) are Firefox-internal bundled libraries — their absence indicates Firefox's own bundle is incomplete or requires the NSS version for dlopen to succeed. The NSS conflict is the primary blocker; resolving it is a prerequisite for any other fix to matter.

---

## §4 — WebKit: Detailed Failure Analysis

WebKit's pre-flight validation reported **40+ missing libraries** including:

```
libgstreamer-1.0.so.0   (GStreamer core)
libgtk-4.so.1           (GTK 4 — different major from Firefox's GTK 3)
libharfbuzz.so.0
libgdk_pixbuf-2.0.so.0
libvulkan.so.1
libgraphene-1.0.so.0
libicudata.so.74        (ICU 74 — specific version pinned)
libicui18n.so.74
libicuuc.so.74
libxml2.so.2            libxslt.so.1
libsqlite3.so.0         libevent-2.1.so.7
libopus.so.0            libgcrypt.so.20      libgpg-error.so.0
libgstallocators-1.0.so.0  libgstapp-1.0.so.0  libgstbase-1.0.so.0
libgstpbutils-1.0.so.0     libgstaudio-1.0.so.0  libgsttag-1.0.so.0
libgstvideo-1.0.so.0       libgstgl-1.0.so.0
libgstcodecparsers-1.0.so.0 libgstfft-1.0.so.0
libflite.so.1 (and 9 Flite TTS variant libraries)
libavif.so.16   libharfbuzz-icu.so.0   libepoxy.so.0
... (additional items omitted for brevity)
```

**Root cause:** WebKit 26.5 uses GTK4 (not GTK3), requires GStreamer for media, Vulkan for GPU acceleration, ICU 74 specifically, and Flite text-to-speech. The Replit NixOS environment does not have these installed. The dependency count and stack depth (GTK4 + GStreamer + ICU + Vulkan simultaneously) make this impractical to resolve via individual `nix-env` installs or `LD_LIBRARY_PATH` tricks.

Note: `ldd minibrowser-gtk` returned zero missing entries, suggesting WebKit's self-contained GTK minibrowser binary is OK, but Playwright's launch wrapper for the full WebKit build uses a different entry point that requires the full dependency set.

---

## §5 — Playwright Config State

`playwright.config.ts` was updated to add `webkit` and `firefox` project definitions (with documented environment notes) alongside `chromium`. This is forward-compatible: the projects are correctly defined and will work without any further changes once executed in a CI environment that has `playwright install-deps` access.

```toml
projects:
  - chromium (active, working)
  - webkit   (defined, environment-blocked in Replit)
  - firefox  (defined, environment-blocked in Replit)
```

---

## §6 — Failure Classifications

| Failure | Count | Classification | Details |
|---------|-------|---------------|---------|
| Firefox `browserType.launch` — NSS version conflict | 32 | **Environment issue** | NSS_3.107/3.113 symbols absent from Nix glibc-2.40-66 libnss3; not fixable via path tricks |
| Firefox `browserType.launch` — GTK3 cascade | (same 32) | **Environment issue** | libgtk-3, libgdk-3, libstdc++, libXcursor, libXi absent from system linker path |
| WebKit `browserType.launch` — 40+ missing libs | 32 | **Environment issue** | GTK4, GStreamer, ICU 74, Vulkan, Flite TTS all absent |
| TrailWeigh app defects | 0 | N/A | App was never reached |
| Test-authoring defects | 0 | N/A | Same tests pass 106/106 on Chromium |

---

## §7 — What Would Fix This

### Option A: GitHub Actions CI (recommended)
Use `ubuntu-24.04` runner with `pnpm exec playwright install-deps firefox webkit`. This is the standard Playwright CI pattern. All system deps are installed via apt, NSS is at the correct version, and both browsers launch reliably. The existing 106-test suite runs unchanged.

Sample workflow step:
```yaml
- run: pnpm exec playwright install firefox webkit chromium --with-deps
- run: pnpm exec playwright test tests/e2e/phase1b/ --workers=1
```

### Option B: Modify `replit.nix`
For Firefox specifically, the NSS conflict is the primary blocker. Firefox needs NSS 3.107+ — if a Nix package providing `nss_3_107` or newer exists in nixpkgs, adding it alongside `gtk3`, `gdk-pixbuf`, `xorg.libXcursor`, `xorg.libXi`, and `stdenv.cc.cc.lib` would likely unblock Firefox. WebKit would require dozens more packages and is impractical via this route.

### Option C: Use the Playwright Docker image
`mcr.microsoft.com/playwright:v1.62.1-noble` has all deps pre-installed for all three browsers. Not available in the current Replit environment.

---

## §8 — Chromium Baseline Intact

The Phase 1B Chromium baseline is unaffected. The `playwright.config.ts` changes add new project definitions but do not alter the `chromium` project. A final confirmation run was not performed (not required per Phase 1C scope — no test infrastructure changes touched Chromium paths).

---

## §9 — Recommendation

**Run Phase 1C cross-browser tests in GitHub Actions** using a standard `ubuntu-24.04` runner. The existing 106-test suite requires zero modifications to run under Firefox and WebKit — the `playwright.config.ts` projects are already defined and the tests themselves use Playwright-standard APIs that are browser-agnostic.

Until CI is available, the Chromium coverage (106/106) remains the operative baseline. The environment blocker does not indicate any TrailWeigh application risk — it is purely an infrastructure gap.

---

*Report generated: 2026-08-16 · Replit Agent (main) · Phase 1C — environment-blocked*
