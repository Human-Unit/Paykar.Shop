# Paykar agent instructions

## Project intent

- This is a time-boxed Paykar.shop recreation and improvement task. Prioritize a working, presentable, verifiable product over speculative architecture.
- Keep the current stack: Next.js, TypeScript, App Router, Tailwind CSS; Python 3.12, FastAPI, Pydantic, SQLAlchemy 2.x, asyncpg, Alembic; PostgreSQL and Docker Compose.
- Preserve existing behavior unless the task explicitly changes it. Prefer narrow, reversible changes over broad rewrites.
- Fix root causes when practical. Do not hide structural or runtime problems behind presentation-only patches.

## Source of truth before editing

Before changing code, inspect the relevant existing implementation and read the smallest set of project docs needed for the task.

Always consider:

- `README.md`
- this `AGENTS.md`
- `docs/design-principles.md` for UI/product behavior
- the nearest relevant file under `docs/redesign/`, `docs/ui-coherence/`, or `docs/progress/` when the task touches those areas

For a UI task, inspect an existing nearby component/style that already represents the intended pattern before inventing a new one.

If code and project docs disagree on a behavior or design decision, resolve the mismatch in the same change when that decision is in scope. Do not create unrelated documentation churn.

## Working method

For each non-trivial task:

1. Identify the exact user-facing or backend behavior being changed.
2. Inspect the current implementation, nearby patterns, scripts, and tests before editing.
3. Make the smallest coherent change that solves the requested problem.
4. Run focused checks first, then the broader checks required by the affected surface.
5. Self-review the final diff for regressions, accessibility, responsiveness, and accidental scope expansion.
6. Report what was actually verified. Never imply that a runtime, browser, provider, or integration check passed unless it was really executed.

Do not add dependencies, abstractions, services, or infrastructure merely because they are common in production systems. Add them only when the current requirement clearly benefits from them.

## Frontend and visual work

When the user supplies a screenshot, mockup, generated concept, or annotated image, treat it as the visual source of truth for the requested surface.

- Extract the intended hierarchy, proportions, spacing, typography, image scale, radii, shadows, gradients, states, and interaction model before editing.
- Match the reference faithfully instead of replacing it with a generic redesign.
- Do not redesign unrelated page regions. If the task targets a block/card/section, preserve the surrounding page shell unless explicitly asked otherwise.
- Reuse existing components, tokens, spacing conventions, and interaction patterns when they already fit the reference.
- Keep text readable and controls deterministic. Visual polish must not break keyboard access, focus states, loading/error states, or mobile behavior.

### Paykar visual language

- Preserve generous negative space around major content areas. Wide side margins and a relatively narrow centered content column are intentional.
- Empty space should create hierarchy around content; do not create large dead zones inside functional cards by making their useful content too small.
- Prefer subtle charcoal-to-green gradients over unnecessary flat fills when they fit the current section.
- Decorative Paykar marks may be used as low-opacity background watermarks, but they must stay behind content and never reduce readability.
- Keep personal/store content honest. Do not fabricate fake orders, templates, counts, stock, or history to make a layout look fuller.
- Follow `docs/design-principles.md`: hide purposeless empty personal sections and surface useful store content or a real action instead.

## React and Next.js expectations

- Keep server/client boundaries intentional; do not turn components into client components without a concrete need.
- Avoid sequential async work when independent work can run in parallel.
- Avoid unnecessary effects, duplicated client state, and derived state stored separately from its source.
- Prefer direct imports and existing primitives over new barrels or duplicate component variants.
- Lazy-load genuinely heavy client-only UI when it materially reduces initial work; do not introduce complexity for tiny wins.
- Keep components focused. Extract a reusable component when multiple real call sites share behavior or visual rules, not pre-emptively.
- After meaningful React/Next.js edits, review for accessibility, unnecessary re-renders, hydration risks, bundle impact, and data-fetching waterfalls.

## Rendered frontend QA

Repository skills live under `.agents/skills/`. For rendered UI changes, visual regressions, responsive bugs, or browser interaction work, read and follow:

- `.agents/skills/frontend-testing-debugging/SKILL.md`

The normal validation loop is:

1. Define the target flow in one sentence.
2. If a Browser integration is available, use it first. Otherwise use the repository's existing Playwright/browser workflow and record the fallback reason.
3. Verify the actual rendered application, not only static code or a successful build.
4. Check page identity, meaningful content, absence of framework error overlays, relevant console errors/warnings, screenshot evidence, and at least one interaction for the changed flow.
5. For reference-driven work, compare the implementation against the reference and keep a short mismatch list until important differences are resolved.

When layout or styling changes can vary by viewport, validate the relevant set of `390`, `768`, `1024`, and `1440` widths. When localization or theme can affect the changed surface, verify the affected RU/TJ/EN and dark/light variants rather than assuming one rendering covers all cases.

A passing build is not sufficient evidence for a rendered UI change.

## Frontend checks

Run commands from `apps/web` as relevant to the change:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test:catalog`
- `npm run test:shopping`
- `npm run test:navigation`
- `npm run test:recommendations`
- `npm run build`

Run the focused tests for the changed feature first. For UI changes, also run browser smoke/interaction checks against the actual runtime.

If a full-repository formatting check fails because of a pre-existing unrelated file, report the exact blocker and still verify the files you changed.

## Backend and database rules

- Keep the FastAPI backend simple. Catalog routes may use SQLAlchemy directly; add services only for shared business rules.
- Alembic is the only migration authority. Do not add database init SQL or `create_all` as an alternative migration path.
- Guest checkout is the intended order flow. Do not add accounts unless explicitly requested.
- Obtain routing before opening the order transaction. Lock products in deterministic ID order, calculate `Decimal` totals from database values, and preserve item snapshots.
- Routing metrics and delivery pricing are separate. Use configurable `DELIVERY_FLAT_PRICE` until explicitly instructed otherwise.
- Distinguish mocked provider tests from real openrouteservice/browser verification. Never claim live routing passed from mocked results.
- Backend checks include `compileall`, `pytest`, Ruff check/format, and Alembic `upgrade`/`current` against PostgreSQL when the affected change requires them.

## Security and scope guardrails

- Keep openrouteservice keys exclusively in the FastAPI environment. Never expose secrets through `NEXT_PUBLIC_*` variables or browser requests.
- Do not introduce microservices, Redis, Kafka, Kubernetes, payment gateways, complex authentication, or other infrastructure without a real requirement.
- Day-3 scope remains focused on UX polish, hardening, and submission verification. Do not add auth, admin, payments, or unrelated features without an explicit request.
- Preserve unrelated work and local modifications. Never delete or rewrite unrelated code merely to make the current change cleaner.

## Git and handoff

- Do not commit, push, merge, force-push, rebase shared work, or mark a PR ready for review unless the user explicitly requests that action.
- If a GitHub branch/commit is explicitly requested, keep changes isolated from `main` until human review.
- In the handoff, summarize the files/surfaces changed, checks actually run, browser/runtime evidence, and any remaining risk or blocked verification.

## Skill usage

- Skills are stored under `.agents/skills/<skill-name>/SKILL.md`.
- Read the selected `SKILL.md` before following that workflow, then load only supporting material that is needed for the current task.
- Skills refine workflow; they do not override the user's requested scope, project constraints, or security rules.
- When `/graphify` is invoked, read the installed graphify `SKILL.md` before taking other actions.

## Upstream workflow references

These instructions are adapted to Paykar from current agent-oriented web-project guidance, especially the AI-first workflow in `agents-repo/webapp`, the AGENTS.md convention, and OpenAI's frontend testing/debugging skill. Keep the Paykar-specific rules above authoritative for this repository.
