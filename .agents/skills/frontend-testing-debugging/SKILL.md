---
name: frontend-testing-debugging
description: "Use when testing, debugging, or making targeted improvements to rendered frontend apps: local dev servers, UI regressions, interaction bugs, console errors, responsive layout, and visual QA. Use Browser tooling first when available; otherwise use the repository's Playwright/browser workflow and record the reason."
---

# Frontend Testing Debugging

Adapted for this repository from OpenAI's `frontend-testing-debugging` skill:
https://github.com/openai/plugins/tree/main/plugins/build-web-apps/skills/frontend-testing-debugging

## Invocation contract

Use this workflow for rendered frontend changes, test/debug work, responsive regressions, reference-image fidelity, and interaction bugs.

Do not require the user to specify browser routing, screenshots, report format, or fallback policy when the target surface can be inferred from the repository and current task.

For any code change to a rendered frontend surface:

1. Identify the target flow.
2. Choose the Browser path below.
3. Make the smallest useful edit.
4. Validate the rendered behavior.
5. Report concrete QA evidence.

## Target flow

Before browser validation, define the flow in one sentence:

`The flow under test is: [entry route] -> [user action or state] -> [expected rendered result].`

For a general smoke test:

`The flow under test is: app loads -> first meaningful screen renders -> primary visible controls respond without runtime errors.`

## Choose the browser path

Classify Browser availability first:

- **Available**: use the Browser integration first and keep the same tab/session for the validation loop.
- **Absent**: use the repository's existing Playwright/browser workflow and record `Browser integration not available`.
- **Invocation failed**: record the actual failure. Fall back to Playwright only when the task permits it.

Do not treat a successful build as a substitute for rendered verification.

## Required rendered checks

Before claiming the UI works, verify:

1. **Page identity**: URL/title correspond to the intended page.
2. **Meaningful render**: the screen is not blank or an empty shell.
3. **No framework overlay**: no Next.js/Webpack/runtime error overlay is visible.
4. **Console health**: no relevant unexplained errors or warnings.
5. **Screenshot evidence**: visual claims are supported by an actual rendered screenshot.
6. **Interaction proof**: exercise at least one interaction in the changed flow and confirm the resulting state.

For visual work, validate desktop plus mobile when practical. For Paykar layout changes that can vary by width, use the viewport matrix required by the repository `AGENTS.md`.

## Reference-driven work

When a screenshot, annotated image, mockup, or generated concept is the source of truth:

- Compare the implementation against the reference after each meaningful iteration.
- Keep a short mismatch ledger: `reference -> rendered result -> fix or intentional deviation`.
- Check hierarchy, content width, negative space, card proportions, spacing, typography, radii, gradients, image scale, clipping, and interactive states.
- Do not compensate for a mismatch by redesigning unrelated areas.

## Playwright/browser fallback loop

When Browser integration is unavailable:

1. Inspect `apps/web/package.json` and existing test scripts first.
2. Start the application with the repository's package manager and expected host.
3. Prefer existing browser/e2e tests when present.
4. Otherwise use Playwright only for the smallest temporary verification needed.
5. Keep screenshots, traces, and temporary QA scripts outside committed source unless the user explicitly requests committed artifacts.
6. After edits, rerun the same flow so before/after evidence is comparable.

Do not add new browser dependencies merely for convenience unless the task truly requires them.

## Visual QA checklist

Check for:

- clipping or accidental horizontal overflow
- overlap and z-index problems
- unreadable or wrapped text
- broken image aspect ratios or missing assets
- unexpected layout shifts
- dead space inside functional cards
- inconsistent side margins or content width
- scroll traps or hidden controls
- stale loading/error states
- keyboard focus regressions
- theme/localization-specific breakage
- animation behavior under reduced motion when relevant

## Paykar-specific viewport/state coverage

When the changed surface is affected by responsive layout, localization, or theme, validate the relevant combinations from:

- widths: `390`, `768`, `1024`, `1440`
- locales: `RU`, `TJ`, `EN`
- themes: dark and light

Do not mechanically run every combination for a tiny unrelated change. Use the combinations that can realistically expose regressions in the changed surface, and expand coverage when layout/text/theme differs.

## QA handoff

For non-trivial rendered UI work, report:

- **Summary**: what visibly changed and whether QA passed.
- **Environment**: URL/runtime, viewport(s), Browser availability, and fallback reason if used.
- **Changes verified**: the exact surface and expected behavior.
- **Checks**: page identity, blank-page check, overlay check, console health, screenshot evidence, and interaction proof.
- **Interaction loop**: the user path actually exercised.
- **Remaining risk**: untested states, widths, browsers, data conditions, or known limitations.

If a check could not be run, say exactly why. Never turn an unverified assumption into a passing result.

## Related repository guidance

- Read the root `AGENTS.md` before using this skill.
- For meaningful React/Next.js changes, also perform the React/Next review described in root `AGENTS.md`.
- This skill does not authorize dependency changes, scope expansion, commits, pushes, or changes to unrelated surfaces.
