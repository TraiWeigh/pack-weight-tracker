# TrailWeigh Workflow Protocol

**Established:** Prompt 014H — 2026-08-06  
**Applies to:** Every future TrailWeigh prompt, correction, investigation, test, or documentation task

---

## Standing Reporting Requirements

After every future TrailWeigh prompt or task, Replit **must**:

1. **Create a new per-prompt report file** inside `workflow-reports/` using the filename format below.
2. **Append the verified report** as a new chronological section to `TRAILWEIGH_COMPLETE_WORKFLOW.md` — do not replace the master file or shorten earlier entries.
3. **Surface or attach the per-prompt report file** in the completion response with its full path, file size, and line count.
4. **Surface or attach the updated master workflow** when practical; if attachment is unavailable, provide a direct clickable project-file link.
5. **Never require the user to manually copy and paste** the workflow or report content.
6. **Mark every acceptance requirement** as `PASS`, `FAIL`, `PARTIAL`, or `NOT TESTED` and explain every non-PASS result.
7. **Include failed attempts and reversions** — do not omit unsuccessful work.
8. **State clearly when user testing is still required** — do not declare visual completion based solely on code changes or automated tests.
9. **Preserve the exact prompt ID and title** as supplied by the user.
10. **Keep application changes and documentation changes separate** — document which files were changed for the feature vs. for documentation.

---

## Per-Prompt Report Filenames

Store every report inside `workflow-reports/`.

Use a sequential filename tied to the prompt number:

| Prompt | Report filename |
|--------|----------------|
| Prompt 014G | `workflow-reports/PROMPT_014G_REPORT.md` |
| Prompt 014H | `workflow-reports/PROMPT_014H_REPORT.md` |
| Prompt 015 | `workflow-reports/PROMPT_015_REPORT.md` |
| Prompt 015A | `workflow-reports/PROMPT_015A_REPORT.md` |
| Prompt 016 | `workflow-reports/PROMPT_016_REPORT.md` |

If a future task has no prompt number, use:

```
workflow-reports/YYYY-MM-DD_HHMM_DESCRIPTIVE_TASK_REPORT.md
```

Use the user's local date and time when available.

Do not overwrite an earlier report.

---

## Required Sections in Every Per-Prompt Report

### 1. Task Identification
- Prompt ID
- Prompt title
- Date and time started
- Date and time completed
- Purpose
- Exact requested outcome

### 2. Original Instructions
Include the complete submitted prompt text exactly when available. Do not replace with a short summary.

### 3. Starting State
- Relevant files before editing
- Existing behavior
- Existing layout or schema
- Known issue
- Before measurements
- Assumptions (clearly labeled)

### 4. Work Performed
Every meaningful action:
- Files opened, searched, created, edited, deleted, restored
- Commands run
- Dependencies changed
- Server restarts and cache clearing
- Failed edits, cancelled edits, retry attempts
- Checkpoints, reversions, undo operations

### 5. Exact Implementation
For every changed file:
- Full path
- What changed and why
- Important functions, constants, classes, schemas, formulas
- Relevant before-and-after code excerpts
- Whether it replaced an earlier implementation

### 6. Testing
- Automated-test command
- Test suites, passed count, failed count, exit code
- Desktop, tablet, and mobile viewport results
- Light-mode, dark-mode, system-mode results
- Functional actions tested
- Console warnings and errors
- Do not claim a test was performed when it was not

### 7. Screenshots and Measurements
- Screenshot filename, source, viewport, purpose
- Visible result
- Before and after measurements
- Acceptance result
- Clearly distinguish Replit screenshots from user screenshots

### 8. Failures and Reversions
- Failed approaches and why they failed
- Changes with no visible effect
- Changes later undone
- How failure was detected
- What replaced them

### 9. Final Current State
- Files changed
- Final behavior, layout, data schema
- Final measurements
- Features preserved and features untouched
- Temporary code removed
- Remaining work

### 10. Acceptance Checklist
Repeat every requirement from the prompt and mark: `PASS` / `FAIL` / `PARTIAL` / `NOT TESTED`

### 11. Unresolved Issues
- Remaining visual or functional problems
- User testing still required
- Conflicts between requested and rendered results
- Suggested next corrective task

---

## Master Workflow Update Procedure

After every future task:

1. Create the per-prompt report.
2. Append that report as a new chronological section to `TRAILWEIGH_COMPLETE_WORKFLOW.md`.
3. Do not replace or truncate the master file.
4. Do not shorten earlier entries.
5. Do not remove failed attempts.
6. Do not rewrite history to make unsuccessful work appear successful.
7. Include the exact prompt ID, title, and completion date.
8. Confirm the append operation succeeded.

---

## Completion Response Requirements

At the end of every future Replit task:

1. Confirm the per-prompt report exists.
2. Confirm the master workflow was updated.
3. Report the exact path of both files.
4. Report the file size and line count of both files.
5. Attach or surface the per-prompt report file.
6. Attach or surface the updated master workflow when practical.
7. If attachment is unavailable, provide a direct clickable project-file link.
8. State whether user testing is still required.
9. Do not require the user to copy the workflow manually.

---

## Accuracy Requirements

For every report and master workflow entry:

- Do not invent actions, measurements, screenshots, or test results.
- Do not state that a requirement passed when it was not tested.
- Do not treat automated tests as proof of visual alignment.
- Do not hide unsuccessful attempts.
- Preserve error messages, measurements, and test results accurately.
- Distinguish confirmed facts from inferences.
- Mark uncertain information as `[UNCERTAIN]`.
- Mark unavailable information as `[UNAVAILABLE IN ACCESSIBLE HISTORY]`.
- Mark inferred information as `[Inference from current source code]`.
- Do not claim project history is complete when older history is inaccessible.

---

## Security and Privacy

Do not include in any report:

- Passwords, login credentials, API keys, access tokens, session tokens, authentication cookies, private authentication data, or secret environment-variable values.

Replace secret values with `[REDACTED]`.

Environment-variable **names** may be documented; their values must not be included.

---

## Protocol Self-Reference

This protocol file itself must be appended to `TRAILWEIGH_COMPLETE_WORKFLOW.md` as a permanent record when it is established, and must be referenced in every future report under section 1 (Task Identification).

---

*Protocol file path: `TRAILWEIGH_WORKFLOW_PROTOCOL.md`*  
*Established by Prompt 014H — 2026-08-06*
