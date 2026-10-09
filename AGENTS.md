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

### Premium visual composition

Use a restrained composition model inspired by high-end interactive product sites: a quiet canvas around a small number of strong visual moments.

- **Quiet canvas, expressive focal point.** Do not make every card, button, and section visually loud. Keep surrounding UI restrained so the important block can carry the drama.
- **One primary visual event per region.** A gradient field, oversized image, animated element, strong watermark, or other expressive treatment should have a clear focal role. Avoid stacking several competing effects in the same region without a reason.
- **Keep interface chrome subordinate.** Navigation, borders, secondary buttons, dividers, labels, and utility controls should not compete with products, prices, primary actions, or key editorial content.
- **Use typography for hierarchy before decoration.** Prefer confident scale, weight, spacing, and line-height over adding more badges, containers, colors, or borders.
- **Build depth with tonal layers and gradients before heavy shadows.** Use black/charcoal/green transitions, subtle borders, blur, and controlled contrast. Avoid large generic drop shadows as the default way to create depth.
- **Alternate calm and dense composition.** Follow information-rich sections with breathing room or a simpler visual statement instead of maintaining the same density across the whole page.
- **Use asymmetry intentionally.** A primary offer, featured product, or important CTA may receive stronger visual treatment than neighboring items. Not every sibling needs equal visual weight.
- **Motion must have a purpose.** Prefer hover, scroll, pointer, reveal, carousel, or state-driven motion over decorative looping animation. Movement should clarify hierarchy, state, or interaction rather than merely prove that animation exists.
- **Motion should feel smooth and physical.** Use restrained distance, easing, opacity, scale, parallax, and layered movement rather than fast or gimmicky effects. Respect `prefers-reduced-motion`.
- **Preserve the visual hierarchy on mobile instead of simply shrinking desktop.** Large focal type may remain large, cards may stack, dense rows may become carousels or vertical groups, and secondary chrome may simplify.
- **Performance is part of the design.** Do not introduce WebGL, large videos, heavy shader effects, expensive scroll listeners, or animation libraries for minor decoration. A premium effect that makes the storefront janky is a regression.
- **Prefer progressive enhancement for spectacle.** Functional shopping, search, cart, checkout, and navigation must remain correct without decorative effects. Visual enhancement must sit on top of a stable core interaction.

A useful composition test is:

`quiet canvas -> strong typography -> generous negative space -> restrained components -> one expressive focal treatment -> interaction-driven motion`

If every visible element is trying to be impressive, simplify until hierarchy returns.

### High-end motion and WebGL effects

When the task explicitly asks for Unicorn-Studio-level motion, shaders, interactive backgrounds, depth effects, or a similarly premium visual centerpiece, treat it as a graphics task rather than ordinary CSS animation. Difficulty is acceptable; visual intention, correct compositing, interaction quality, and performance matter more than choosing the easiest implementation.

#### Understand the scene before coding

Before implementing a complex visual effect, write a short internal scene brief covering:

1. the visual purpose and focal point;
2. the layer stack;
3. which layers are DOM content versus WebGL/media decoration;
4. blend modes, masks, clipping, and depth relationships;
5. time-based motion;
6. pointer/hover/scroll/appear inputs;
7. expected desktop/mobile behavior;
8. performance budget and fallback behavior.

Do not start by adding random gradients, particles, or blur blobs. Know what each layer contributes to the final composition.

#### Use a layer-and-effect composition model

Unicorn Studio's core model is layer based: shapes, images, text, media, 3D and effects are stacked spatially; effects can target a layer or everything below them; masks and blend modes are part of the composition. Recreate that logic when building Paykar effects.

A typical Paykar focal scene may use a stack such as:

`base tone -> radial/linear light field -> product/logo/media layer -> depth/displacement -> noise/distortion -> masked glow -> vignette/grain -> DOM content above`

Rules:

- Effects are first-class visual layers, not finishing filters added after layout is done.
- Prefer a few well-tuned layers over many weak effects.
- Use masks and clipping to shape light and distortion instead of letting effects spill uniformly across the whole section.
- Use blend/composite behavior deliberately. Overlay, screen/additive-like light, multiply/darken, alpha masks, and restrained opacity can create richer depth than extra shadows.
- Centerpiece shader techniques may include animated noise, radial fields, SDF shapes, displacement, depth-map parallax, blur/bloom-like passes, particles, volumetric-looking haze, dithering, chromatic separation, or custom fragment shaders when the art direction calls for them.
- Do not clone Unicorn Studio's exact artwork or palette. Adapt the method to Paykar's black/charcoal/green identity, Paykar mark, products, and current page composition.

#### Motion is native to the scene

Do not treat animation as a final `fadeIn` pass. Define motion while defining the scene.

Map animation to meaningful inputs:

- **time** for slow ambient evolution;
- **pointer position/proximity** for depth, light attraction, subtle distortion, or bloom response;
- **hover** for local emphasis and state transitions;
- **scroll progress** for reveals, masks, depth changes, or scene progression;
- **appear/viewport entry** for introduction and prewarming rather than repeated gimmicks.

Interaction quality rules:

- Normalize input values before sending them to shaders or transforms.
- Bound amplitudes so pointer/scroll motion never exposes texture edges or breaks composition.
- Smooth raw input with damping/spring/inertia rather than mapping the cursor directly to large movement.
- Keep reactive movement subtle unless the reference clearly demands something dramatic.
- Prefer one coherent interaction model over several unrelated animations fighting each other.
- Time-based loops should evolve slowly enough that the scene feels alive rather than restless.

#### Depth and dimensionality

For flat product or editorial imagery, depth can be created with a grayscale depth map and small UV displacement/parallax. Keep the displacement restrained; large offsets reveal artifacts quickly.

For true geometry, camera perspective, physically meaningful depth, or complex 3D object interaction, use a real 3D/WebGL scene rather than pretending that a 2D shader plane is a full 3D world.

#### Keep real content in the DOM

Do not move headings, prices, buttons, navigation, important labels, or SEO/accessibility-critical text into WebGL merely because the canvas can render text.

- Keep semantic content as HTML above or alongside the visual scene.
- Treat the shader/canvas as a visual surface.
- Canvas visuals must not block pointer interaction with real controls unless interaction with the canvas is the task itself.
- Provide an accessible/static equivalent when the scene communicates information rather than decoration.

#### Preferred Paykar implementation path

For a premium focal scene, choose the implementation intentionally:

1. **Unicorn Studio authored scene** — preferred when the goal is rapid art-direction exploration, sophisticated layer/effect compositing, or close use of the Unicorn workflow. If Unicorn MCP/export is available, iterate visually there, then embed or self-host the published JSON/runtime in Paykar. Keep application content in the DOM.
2. **Code-owned WebGL/Three.js scene** — preferred when the effect needs tight integration with application state, custom shader logic, geometry/camera control, or no external scene dependency. Recreate the same layer/effect discipline with shader passes/render targets instead of reducing the design to basic CSS blobs.
3. **CSS/Framer Motion** — use for surrounding orchestration, DOM reveals, layout transitions, and lightweight accents. Do not use it as a substitute when the requested visual depends on real shader distortion, depth, particles, or per-pixel interaction.

A new WebGL/Three.js/Unicorn runtime dependency is justified when the task explicitly calls for a high-end focal effect and the visual cannot be reproduced faithfully with the current stack. Keep that dependency isolated to the visual component and verify its bundle/runtime cost.

#### Performance is part of authorship

WebGL scenes usually pay for layers/effects as shader passes, draw calls, texture reads, framebuffers, and memory. Expensive raymarching, large multi-pass blur, full-resolution particles, and many independent canvases can destroy the experience even when each effect looks good in isolation.

For complex scenes:

- profile while designing, not only at the end;
- target smooth `60fps` on capable desktop hardware; `30fps` can be an intentional fallback for ambient/mobile scenes;
- downsample expensive passes when full resolution is visually unnecessary;
- keep device-pixel-ratio/render scale controlled instead of blindly rendering at maximum DPR;
- merge/flatten compatible visual layers or shader work when doing so reduces passes without changing the intended result;
- cull hidden/occluded work and pause rendering when the scene is offscreen or the document is hidden;
- lazy-load below-the-fold scenes and prewarm/compile expensive shaders before the first critical interaction when practical;
- avoid several simultaneously active WebGL scenes in one viewport unless profiling proves the budget is safe;
- release WebGL resources and destroy scenes on route/component unmount;
- test texture sizes, video resolution, particle counts, blur radius/passes, draw calls, memory, frame time, and dropped frames rather than judging performance from build success.

If using the Unicorn Studio runtime, prefer its production controls before inventing custom runtime management: `lazyLoad`, render `scale`, `dpi`, `fps`, production caching, visibility gating, responsive breakpoints, and explicit scene destruction on unmount.

#### Progressive degradation

Every complex visual scene needs a deliberate fallback strategy:

- `prefers-reduced-motion` must simplify or freeze non-essential continuous motion;
- weak/mobile hardware may use lower render scale/DPI/FPS, fewer effects, a lighter scene, or a static rendered fallback;
- a WebGL initialization failure must not make the shopping interface disappear;
- the visual layer must be removable without breaking layout or functionality.

Do not call a scene production-ready until both the full and degraded paths have been checked.

#### Visual iteration loop

Use this sequence for reference-driven premium motion work:

1. reproduce the static composition and visual weight first;
2. build the minimal shader/effect stack that creates the focal appearance;
3. add time motion;
4. add one interaction source at a time;
5. compare against the reference and keep a mismatch ledger;
6. tune blend, opacity, scale, masking, motion amplitude, damping, and pacing;
7. profile and optimize without flattening the art direction into a generic gradient;
8. verify desktop, mobile, reduced-motion, loading, resize, and interaction behavior in the real browser.

The target is not "add WebGL." The target is a coherent visual scene whose composition, motion, interaction, and performance feel intentionally authored.

#### Research basis for this workflow

This section is informed by current Unicorn Studio documentation/runtime guidance and George Hastings' published explanation of the tool's method: layer-based composition, effects as first-class scene elements, masks/blend modes, native appear/hover/scroll/mousemove animation, depth-map parallax, effect stacking, flattening compatible layers, per-layer downsampling/DPI/FPS controls, and frame/draw-call/memory profiling.

Primary references:

- `https://www.unicorn.studio/`
- `https://www.unicorn.studio/docs/mcp/`
- `https://github.com/hiunicornstudio/unicornstudio.js`
- `https://tympanus.net/codrops/2026/03/04/webgl-for-designers-creating-interactive-shader-driven-graphics-directly-in-the-browser/`

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

These instructions are adapted to Paykar from current agent-oriented web-project guidance, especially the AI-first workflow in `agents-repo/webapp`, the AGENTS.md convention, OpenAI's frontend testing/debugging skill, Unicorn Studio's published WebGL workflow/runtime guidance, and premium interactive-web composition patterns. Keep the Paykar-specific rules above authoritative for this repository.
