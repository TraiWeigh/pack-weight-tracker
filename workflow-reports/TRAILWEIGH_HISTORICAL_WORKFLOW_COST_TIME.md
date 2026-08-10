# TrailWeigh Historical Workflow Cost & Time Report

**Generated:** 2026-08-10 (Prompt 023J)

---

> **This report contains verified Replit values only. Missing historical time/cost/workflow metrics are marked NOT AVAILABLE and are not estimated.**

---

## Data Sources Inspected

| Source | Accessible | Contains Metrics |
|--------|-----------|-----------------|
| `workflow-reports/PROMPT_*.md` individual reports | YES — 83 files read | Dates, status, test counts, files changed. NO time/actions/cost/lines. |
| `workflow-reports/TRAILWEIGH_COMPLETE_WORKFLOW.md` | YES | Summaries only; no workflow metrics |
| `workflow-reports/PRE_*.md` backup files | YES (as checkpoint evidence) | File dates usable as timestamp evidence only |
| `workflow-reports/*.zip` archive listing | YES — 50 ZIPs verified | Presence confirmed; no metrics inside |
| Replit Agent workflow-summary UI metadata | NOT ACCESSIBLE PROGRAMMATICALLY | UI shows time/actions/cost; Agent cannot retrieve these via any API |
| `fetchDeploymentLogs()` | YES — called | No historical session logs returned |
| `getDeploymentInfo()` | YES — called | Deployment state only; no per-prompt billing |
| Replit billing / usage API | NOT ACCESSIBLE TO AGENT | Agent has no billing API access |

**User-provided 023I screenshot values (time 4 min, actions 25, lines 1,074, cost $0.58):**
These values were provided by the user from a Replit workflow-summary UI screenshot. Agent cannot independently verify them from any programmatically accessible source. They are recorded in the 023I row as USER-PROVIDED (not independently verified).

---

## Complete Prompt Inventory

### Prompts Before 014H

| Prompt | Notes |
|--------|-------|
| Pre-014H | No reports found. The earliest report in `workflow-reports/` is `PROMPT_014H_REPORT.md`. The codebase contains test files (`bgCollections.test.mjs`, `controls017.test.mjs`, `moveItem.test.mjs`, `pieColor.test.mjs`, `sidebar019.test.mjs`, `usePackData.test.mjs`, `newClearLight041.test.mjs`) whose naming does not match the main prompt numbering sequence, suggesting earlier development phases exist but no formal reports are accessible. |

### Main Prompt Table

| Prompt | Title / Scope | Date | Time Worked | Actions | Items Read | Lines Read | Agent Cost | Checkpoint | Replit Status | User Verified | Overall Status | Rework | Metric Source |
|--------|--------------|------|------------|---------|-----------|-----------|-----------|-----------|--------------|--------------|---------------|--------|--------------|
| 014H | Create Complete TrailWeigh Workflow-Documentation System | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS | NOT AVAILABLE | PASS | YES — history incomplete, user review required | PROMPT_014H_REPORT.md |
| 014I | Quick Category Width and QTY Heading Correction | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (47/47) | PARTIAL — QTY centering pending | PARTIAL | YES — 014J corrective follow-up | PROMPT_014I_REPORT.md |
| 014J | Restore Master Workflow and Correct QTY Heading | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PROMPT_014I_TRUNCATED_MASTER_BACKUP.md | PASS (47/47) | PARTIAL — QTY visual verify pending | PARTIAL | YES — restoration after truncation | PROMPT_014J_REPORT.md |
| 014K | Final QTY Heading Alignment Correction | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS | PASS — user screenshot confirmed | PASS | NO | PROMPT_014K_REPORT.md |
| 014L | Complete the Missing 014K Documentation | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS | NOT AVAILABLE | PASS | YES — required 014M to create self-report | PROMPT_014L_REPORT.md |
| 014M | Finish 014L Documentation + Record Visual Approval | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_014M_MASTER_BACKUP.md | PASS (47/47) | NOT AVAILABLE | PASS | NO | PROMPT_014M_REPORT.md |
| 014N | Synchronize Master Workflow Summary Sections | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_014N_MASTER_BACKUP.md | PASS (47/47) | NOT AVAILABLE | PASS | YES — doc inconsistencies led to 014O | PROMPT_014N_REPORT.md |
| 014O | Restore Workflow Protocol + Finish Documentation Cleanup | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_014O_MASTER_BACKUP.md + PRE_014O_TESTING_BACKUP.md | PASS (47/47) | NOT AVAILABLE | PASS | YES — remaining unresolved issues noted | PROMPT_014O_REPORT.md |
| 015 | (Title not extracted in this session — report exists) | 2026-08-06 (inferred from PRE_015_MASTER_BACKUP.md date) | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_015_MASTER_BACKUP.md | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | PROMPT_015_REPORT.md (content not extracted) |
| 016 | (Title not extracted in this session — report exists) | 2026-08-06 (inferred from PRE_016_MASTER_BACKUP.md date) | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_016_MASTER_BACKUP.md | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | PROMPT_016_REPORT.md (content not extracted) |
| 016A | (Title not extracted in this session — report exists) | 2026-08-06 (inferred from PRE_016A_MASTER_BACKUP.md date) | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_016A_MASTER_BACKUP.md | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | PROMPT_016A_REPORT.md (content not extracted); ZIP: trailweigh-016A-report.zip |
| 016B | Fix Theme Label and Reliable Photo Storage | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (659/659) | NOT AVAILABLE | PASS | YES — shared photos device-local, absent for recipients | PROMPT_016B_REPORT.md; ZIP: trailweigh-016B-report.zip |
| 016C | Repair PDF Importer Regression | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (692/692); password-protected PARTIAL | PARTIAL — user retest required | PARTIAL | NO | PROMPT_016C_REPORT.md |
| 017 | Replace Showcase with Hide; Reorganize Preview Controls | 2026-08-06 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (716/716) | NOT TESTED (signed-in) | PARTIAL | YES — signed-in testing needed | PROMPT_017_REPORT.md |
| 017A | Make the Hide Pill Always Visible | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (716/716) | NOT TESTED (signed-in) | PARTIAL | YES — fixes 017 defect | PROMPT_017A_REPORT.md |
| 017B | Stop Landscape Thumbnails from Shaking on Hover | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (738/738) | NOT TESTED (dynamic hover) | PARTIAL | YES — human hover testing required | PROMPT_017B_REPORT.md |
| 017C | Stop Landscape Shaking When Active Background Displayed | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (762/762) | NOT TESTED | PARTIAL | YES — 017B insufficient, fix required | PROMPT_017C_REPORT.md |
| 017D | Landscape Thumbnail Shaking — Confirmed Root Cause & Fix | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_017D_MASTER_BACKUP.md | PASS (788/788) | NOT TESTED | PARTIAL | YES — 017C confirmed ineffective | PROMPT_017D_REPORT.md |
| 017E | Landscape Thumbnail Geometry Instability: Full Root Cause & Unified Fix | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (826/826) | PASS — user confirmed hover/Darken resolved | PASS | YES — incorporated new slider evidence | PROMPT_017E_REPORT.md |
| 017F | Restore Scan Gear List After Post-017E Regression | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_017F_MASTER_BACKUP.md | PASS (826/826) | PASS — user confirmed PDF/Word/Excel/Numbers | PASS | YES — operational recovery after API stopped | PROMPT_017F_REPORT.md |
| 018 | Active File Name + Save Confirmation | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (846/846) | NOT TESTED | PARTIAL | YES — 018A corrective follow-up | PROMPT_018_REPORT.md |
| 018A | Active File Name Position + Theme Text Color (correction to 018) | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (866/866) | NOT TESTED | PARTIAL | YES — 018B corrective follow-up | PROMPT_018A_REPORT.md |
| 018B | Match Active File Name Pill to Hide (correction to 018A) | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (896/896) | NOT TESTED | PARTIAL | YES — 018C corrective follow-up | PROMPT_018B_REPORT.md |
| 018C | Align Active File Name Pill to Top Control Row (correction to 018B) | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (925/925) | NOT TESTED | PARTIAL | NO | PROMPT_018C_REPORT.md |
| 019 | Background Edit Pill + Separate Collapsible Summary Panels | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (961/961) | NOT TESTED | PARTIAL | NO | PROMPT_019_REPORT.md |
| 020 | New Starts With No Categories | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (997/997) | NOT TESTED | PARTIAL | YES — 020B corrective follow-up | PROMPT_020_REPORT.md |
| 020B | Restore Saved Appearance on First Open After New | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (1041/1041) | NOT TESTED | PARTIAL | YES — 020C corrective follow-up | PROMPT_020B_REPORT.md |
| 020C | Make New Deterministically Reset to Clear + Light | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (1071/1071) | NOT TESTED | PARTIAL | YES — 020D corrective follow-up | PROMPT_020C_REPORT.md |
| 020D | Separate New Appearance From Saved-File Appearance | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_020D_MASTER_BACKUP.md | PASS (1101/1101) | NOT TESTED | PARTIAL | YES — 020E corrective follow-up | PROMPT_020D_REPORT.md |
| 020E | Stop Cross-Tab Background Leakage + Protect Saved Appearance Data | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_020E_MASTER_BACKUP.md | PASS (108/108 focused) | NOT TESTED | PARTIAL | YES — 020F corrective follow-up | PROMPT_020E_REPORT.md |
| 020F | (Title not extracted; report exists) | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS | NOT TESTED | PARTIAL | NO | PROMPT_020F_REPORT.md |
| 021 | Share Link Repair | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (27 new structural tests) | NOT TESTED | PARTIAL | YES — 021A corrective follow-up | PROMPT_021_REPORT.md; ZIP: trailweigh-021-report.zip |
| 021A | Protect Private Checklist + Repair Locker Delete Auth | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021A backup | PASS (28 focused) | NOT TESTED | PARTIAL | YES — 021B superseding | PROMPT_021A_REPORT.md; ZIP: trailweigh-021A-report.zip |
| 021B | Simplify Private Delete + Shared Locker View/Copy Only | 2026-08-07 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (1197/1197; 31 suites) | NOT TESTED | PARTIAL | YES — 021C corrective follow-up | PROMPT_021B_REPORT.md; ZIP: trailweigh-021B-report.zip |
| 021C | Add View-Only Shared Locker + Preserve Viewer Isolation | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021C_MASTER_BACKUP.md | PASS (1267/1267; 32 suites) | NOT TESTED | PARTIAL | YES — 021D corrective follow-up | PROMPT_021C_REPORT.md; ZIP: trailweigh-021C-report.zip |
| 021D | Make Shared Locker Visible in Real Shared Link | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021D_MASTER_BACKUP.md | PASS (1299/1299; 33 suites) | NOT TESTED | PARTIAL | YES — 021E corrective follow-up | PROMPT_021D_REPORT.md; ZIP: trailweigh-021D-report.zip |
| 021E | Fix Real Shared Locker + Share Pack List | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (45 new; 34 suites) | NOT TESTED | PARTIAL | YES — 021F corrective follow-up | PROMPT_021E_REPORT.md; ZIP: trailweigh-021E-report.zip |
| 021F | Fix Share Menu Consistency + Panel Order + Labels | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (31 new; 35 suites) | NOT TESTED | PARTIAL | YES — 021G corrective follow-up | PROMPT_021F_REPORT.md; ZIP: trailweigh-021F-report.zip |
| 021G | Fix Shared File Open + Scan Gear List Chevron | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (1387/1387; 36 suites) | NOT TESTED | PARTIAL | NO | PROMPT_021G_REPORT.md; ZIP: trailweigh-021G-report.zip |
| 021H | Rebalance Vertical Gutters and Center Sidebar | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021H_MASTER_BACKUP.md | PASS (29 focused; 37 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021H_REPORT.md; ZIP: trailweigh-021H-report.zip |
| 021I | Pixel Baseline Diagnostic Report | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | N/A — diagnostic only, 0 app changes | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021I_REPORT.md; ZIP: trailweigh-021I-report.zip |
| 021J | Exact Gutter Correction + Collapsible-Panel Chevron Direction | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021J_MASTER_BACKUP.md | PASS (37 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021J_REPORT.md; ZIP: trailweigh-021J-report.zip |
| 021K | Restore Category Padding and Equalize Main Gutters | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021K_MASTER_BACKUP.md | PASS (37 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021K_REPORT.md; ZIP: trailweigh-021K-report.zip |
| 021L | Center Sidebar Panel + Fix Scan Gear List Disclosure Chevron | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021L_MASTER_BACKUP.md | PASS (26 focused; 38 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021L_REPORT.md; ZIP: trailweigh-021L-report.zip |
| 021M | Align Toolbar Control Groups With Panel Edges | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_021M_MASTER_BACKUP.md | PASS (24 focused; 39 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021M_REPORT.md; ZIP: trailweigh-021M-report.zip |
| 021N | Toolbar Group Container | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (36 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021N_REPORT.md; ZIP: trailweigh-021N-report.zip |
| 021O | Move the Entire Toolbar Group Up | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (25 focused; 41 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021O_REPORT.md; ZIP: trailweigh-021O-report.zip |
| 021P | Align Pack Summary Top Edge With Checklist Panel | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (22 focused; 42 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_021P_REPORT.md; ZIP: trailweigh-021P-report.zip |
| 022 | Add TrailWeigh Footer, Legal, Help & Support Navigation | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (44 focused; 43 suites) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022_REPORT.md; ZIP: trailweigh-022-report.zip |
| 022A | Add Footer to Main Checklist Page | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (20 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022A_REPORT.md; ZIP: trailweigh-022A-report.zip |
| 022B | Complete Footer Page Content + Detailed Help & How-To | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (70 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022B_REPORT.md; ZIP: trailweigh-022B-report.zip |
| 022C | Reorganize and Simplify Help & How-To | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (68 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022C_REPORT.md; ZIP: trailweigh-022C-report.zip |
| 022D | Build About TrailWeigh Accordion Content | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (106 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022D_REPORT.md; ZIP: trailweigh-022D-report.zip |
| 022E | Update How It Works | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (48 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022E_REPORT.md; ZIP: trailweigh-022E-report.zip |
| 022F | Shared-Link Footer Overlay Fix | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — PRE_022F backup | PASS (32 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022F_REPORT.md; ZIP: trailweigh-022F-report.zip |
| 022G | Restore Last Workspace With All Panels Closed | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES — 3 PRE_022G backups | PASS (56 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022G_REPORT.md; ZIP: trailweigh-022G-report.zip |
| 022H | Start Shared Links With All Panels Closed | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (37 focused) | NOT TESTED | PARTIAL | NOT DOCUMENTED | PROMPT_022H_REPORT.md; ZIP: trailweigh-022H-report.zip |
| 022I | Complete Shared-Link Collapse & Share Behavior | 2026-08-08 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (41 focused) | NOT TESTED | PARTIAL | YES — 3 stale test fixes required | PROMPT_022I_REPORT.md; ZIP: trailweigh-022I-report.zip |
| 022J | Consistent Native Share + Default Panel State | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (45 new) | NOT TESTED | PARTIAL | NO | PROMPT_022J_REPORT.md; no ZIP |
| 022K | REPORT MISSING | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | No PROMPT_022K_REPORT.md found; no ZIP |
| 022L | Expanded About + Sources & References | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (92 new + 106 updated) | NOT TESTED | PARTIAL | NO | PROMPT_022L_REPORT.md; no ZIP |
| 022M | Improve Sign-In / Form Field Visibility | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (23 new) | NOT TESTED | PARTIAL | NO | PROMPT_022M_REPORT.md; no ZIP |
| 022N | Increase Sign-In Contrast & Fix Continue Button States | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (25 new) | NOT TESTED | PARTIAL | NO | PROMPT_022N_REPORT.md; no ZIP |
| 022O | Fix Password Recovery + Password Visibility + Auth Contrast | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (21 new + 22 auth-flow) | NOT TESTED | PARTIAL | NO | PROMPT_022O_REPORT.md; ZIP: trailweigh-022O-report.zip |
| 022P | Delete Custom Background Themes | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (38 new) | NOT TESTED | PARTIAL | NO | PROMPT_022P_REPORT.md; ZIP: trailweigh-022P-report.zip |
| 022Q | REPORT MISSING | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | No PROMPT_022Q_REPORT.md found; no ZIP |
| 022R | Mobile Compatibility & Cross-Device Synchronization | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (50 new) | NOT TESTED | FAIL | YES — superseded/corrected by 022S after sync failure | PROMPT_022R_REPORT.md; ZIP: trailweigh-022R-report.zip |
| 022S | Fix Failed iPhone Locker Synchronization | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (55 new) | PARTIAL — real-iPhone pending | PARTIAL | YES — corrective rework of 022R bugs | PROMPT_022S_REPORT.md; ZIP: trailweigh-022S-report.zip |
| 022T | Fix Real-Device Sync by Proving Build/Environment/Account/Server State | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (76 new) | PARTIAL — real-iPhone pending | PARTIAL | NO | PROMPT_022T_REPORT.md; ZIP: trailweigh-022T-report.zip |
| 022U | Fix Mobile Locker Scrolling and Saved-File Visibility | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (26 new + 1 updated) | PARTIAL — real-iPhone pending | PARTIAL | NO | PROMPT_022U_REPORT.md; ZIP: trailweigh-022U-report.zip |
| 022V | Fix Mobile Portrait Toolbar and Pill Alignment | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (26 new) | PARTIAL — real-iPhone pending | PARTIAL | NO | PROMPT_022V_REPORT.md; ZIP: trailweigh-022V-report.zip |
| 022W | Correct Mobile Portrait Toolbar Layout with Explicit Rows | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS | PARTIAL — real-iPhone pending | PARTIAL | NOT DOCUMENTED | PROMPT_022W_REPORT.md; ZIP: trailweigh-022W-report.zip |
| 022X | Restore Intended Toolbar/Pill Positions on Mobile | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS | PARTIAL — real-iPhone pending | PARTIAL | NO | PROMPT_022X_REPORT.md; ZIP: trailweigh-022X-report.zip |
| 022Y | Fix Custom-Theme Delete Warning Position | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS | PARTIAL — real-iPhone pending | PARTIAL | NO | PROMPT_022Y_REPORT.md; ZIP: trailweigh-022Y-report.zip |
| 022Z | Fix Custom-Theme Delete Confirmation Jump and Double-Click | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS | PARTIAL — real-iPhone pending | PARTIAL | NO | PROMPT_022Z_REPORT.md; ZIP: trailweigh-022Z-report.zip |
| 023A | Make Custom-Theme Deletion Undoable | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (41/41) | NOT TESTED | PARTIAL | NO | PROMPT_023A_REPORT.md; ZIP: trailweigh-023A-report.zip |
| 023B | BackgroundPicker Theme Names/Order + Phone Layout Redesign | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (0 failures) | NOT TESTED | PARTIAL | NO | PROMPT_023B_REPORT.md; ZIP: trailweigh-023B-report.zip |
| 023C | Themes, Phone Spacing & Multi-Use Messaging | 2026-08-09 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (0 failures) | NOT TESTED | PARTIAL | NO | PROMPT_023C_REPORT.md; ZIP: trailweigh-023C-report.zip |
| 023D | Remove Replit-Added Duplicate Themes + Fix About Multi-Use Intro | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (315/315) | NOT TESTED | PARTIAL | NO | PROMPT_023D_REPORT.md; ZIP: trailweigh-023D-report.zip |
| 023E | Bar Color/Text Styling, Focus Fix, Share Hover, Landing Rewrite | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (60/60) | NOT TESTED | PARTIAL | NO | PROMPT_023E_REPORT.md; ZIP: trailweigh-023E-report.zip |
| 023F | Complete Bar Color / Text / Font Coverage | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (160/160) | NOT TESTED | PARTIAL | NO | PROMPT_023F_REPORT.md; ZIP: trailweigh-023F-report.zip |
| 023G | Bar Style Transparency, Window Isolation, Visual Polish | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT MENTIONED | PASS (92/92) | FAIL — blank-screen regression | FAIL | YES — blank screen required emergency 023H | PROMPT_023G_REPORT.md; ZIP: trailweigh-023G-report.zip |
| 023H | Emergency Recovery: Fix Blank-Screen Regression | 2026-08-10 | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | NOT AVAILABLE | YES | PASS (111/111) | PARTIAL — deployed user verify pending | PARTIAL | YES — emergency recovery from 023G | PROMPT_023H_REPORT.md; ZIP: trailweigh-023H-report.zip |
| 023I | Emergency Backend Recovery: Fix 502 API Failures | 2026-08-10 | USER-PROVIDED: 4 min | USER-PROVIDED: 25 | USER-PROVIDED: 1,074 | USER-PROVIDED: 1,074 | USER-PROVIDED: $0.58 | YES | FAIL — investigation only; backend still down | FAIL | PARTIAL | YES — DATABASE_URL missing; fix not yet applied | PROMPT_023I_REPORT.md; ZIP: trailweigh-023I-report.zip |

**Notes on 023I user-provided values:** The user provided a workflow-summary screenshot showing time=4 min, actions=25, lines read=1,074, agent cost=$0.58. These values cannot be independently verified by Agent from any programmatic API. They are recorded here as USER-PROVIDED and should not be counted in verified totals.

---

## Missing Reports

| Prompt | Report Present | ZIP Present | Notes |
|--------|---------------|------------|-------|
| 022K | NO | NO | No report file, no ZIP, no test file referencing this ID |
| 022Q | NO | NO | No report file, no ZIP, no test file referencing this ID |

---

## Missing ZIPs (Reports Exist)

| Prompt | ZIP Present | Notes |
|--------|------------|-------|
| 014H | NO | Report exists; ZIP not created |
| 014I | NO | Report exists; ZIP not created |
| 014J | NO | Report exists; ZIP not created |
| 014K | NO | Report exists; ZIP not created |
| 014L | NO | Report exists; ZIP not created |
| 014M | NO | Report exists; ZIP not created |
| 014N | NO | Report exists; ZIP not created |
| 014O | NO | Report exists; ZIP not created |
| 015 | YES (trailweigh-015-report.zip) | |
| 016 | NO | Report exists; ZIP not created |
| 016A | YES (trailweigh-016A-report.zip) | |
| 016B | YES (trailweigh-016B-report.zip) | |
| 016C | NO | Report exists; ZIP not created |
| 017 | NO | Report exists; ZIP not created |
| 017A through 017F | NO | Reports exist; ZIPs not created |
| 018 through 018C | NO | Reports exist; ZIPs not created |
| 019 | NO | Report exists; ZIP not created |
| 020 through 020F | NO | Reports exist; ZIPs not created |
| 022J | NO | Report exists; ZIP not created |
| 022L through 022N | NO | Reports exist; ZIPs not created |

---

## Verified Cost & Time Calibration Data

| Metric | Value |
|--------|-------|
| Prompts inventoried (total with reports) | **83** |
| Prompts with missing reports | **2** (022K, 022Q) |
| Total prompt IDs identified | **85** |
| Prompts with VERIFIED actual time worked | **0** |
| Prompts with VERIFIED actual agent cost | **0** |
| Prompts with VERIFIED actual actions count | **0** |
| Prompts with VERIFIED actual lines read | **0** |
| Prompts missing all workflow metrics | **85** (100%) |
| Total VERIFIED agent cost | **NOT AVAILABLE** |
| Total VERIFIED time worked | **NOT AVAILABLE** |
| Average verified cost per prompt | **NOT AVAILABLE** |
| Average verified time per prompt | **NOT AVAILABLE** |
| Average verified cost per minute | **NOT AVAILABLE** |
| User-provided 023I values (unverified) | time=4 min, actions=25, lines=1,074, cost=$0.58 |

**Why workflow metrics are universally unavailable:** The Replit Agent workflow-summary UI (which shows time worked, actions, items read, lines read, and agent cost) is visible to the user in the Replit interface but is **not accessible to the Agent programmatically**. No API callback (`fetchDeploymentLogs`, `getDeploymentInfo`, `viewEnvVars`, etc.) returns historical per-session billing or workflow metrics. None of the 83 existing reports captured these values at time of writing. This is a structural gap in the documentation protocol.

---

## Work Category Classification

Based on report titles and scope descriptions (no verified cost/time to calculate category averages):

| Category | Prompts | Notes |
|----------|---------|-------|
| Documentation / reporting | 014H, 014I (partial), 014J, 014K, 014L, 014M, 014N, 014O, 023J | Workflow system, master backups, doc cleanup |
| UI / CSS / layout | 017, 017A–F, 018, 018A–C, 019, 021H–P, 022A–C, 022J, 022V–X, 023B, 023C, 023E, 023F, 023G | Visual corrections, layout, toolbar, gutter, mobile |
| State / storage | 020, 020B–F | Background appearance isolation, cross-tab leakage |
| Themes / background | 016A, 016B, 022P, 022Y, 022Z, 023A, 023D | Theme labels, photo storage, delete/undo |
| Share / link | 021, 021A–G, 022F–I | Share link, Locker visibility in shared view |
| Auth / sign-in | 021A, 022M, 022N, 022O | Sign-in contrast, password, auth protection |
| Content / copy | 022B–E, 022L, 023C | Help, About, footer content, multi-use messaging |
| Sync / database / backend | 022R–U, 023I | Mobile sync, Locker API, 502 recovery |
| Deployment / recovery | 023H, 023I | Blank screen recovery, backend down |
| Import / PDF repair | 016C, 017F | PDF importer regressions |
| Mobile | 022V–Z, 023B | Portrait toolbar, mobile layout |
| Testing / integration | All prompts (tests written throughout) | No dedicated test-only prompts |

**No category cost averages are calculated because no verified cost or time values exist.**
