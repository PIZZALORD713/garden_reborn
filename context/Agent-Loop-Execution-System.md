# fRiENEMiES — Agent Loop Execution System

Purpose: Implement UI/UX upgrades fast while minimizing drift and preserving code quality.

Related:
- `context/Frienemies-UI-Upgrade-Prep.md`

---

## 1) Operating Model (3-Agent Loop)

For each micro-slice of work, run this loop:

1. **Planner Agent** → writes mini-spec + acceptance checks
2. **Implementer Agent** → changes code only within spec
3. **Reviewer Agent** → audits diff against spec + regressions
4. **Human (Pizza) checkpoint** → approve / request revision

No merge unless Reviewer returns **PASS**.

---

## 2) Slice Definition Rules (Anti-Drift)

Each slice must include:
- **Area:** exact UI scope
- **Change:** precise behavior/style/copy changes
- **Non-goals:** what is explicitly out-of-scope
- **Acceptance checks:** objective tests
- **Risk notes:** likely regressions

### Good slice examples
- "Onboarding: change CTA labels + button hierarchy only"
- "Carousel: simplify visibility state to pinned/unpinned only"

### Bad slice examples
- "Improve onboarding and search and mobile nav"
- "Refactor main.js while changing UX"

---

## 3) Branch + Commit Convention

- Branch per slice: `feat/ui-<slice-id>`
- Commit format:
  - `feat(ui): <short change> [spec:<slice-id>]`
  - `fix(ui): <short fix> [spec:<slice-id>]`
  - `docs(ui): <short doc update> [spec:<slice-id>]`

One concern per commit. No mixed commits.

---

## 4) Required Quality Gates (Hard Stops)

Before merge, all must pass:
- [ ] Feature matches mini-spec acceptance checks exactly
- [ ] No console errors in normal interaction
- [ ] Core flows still work:
  - [ ] token load by ID
  - [ ] wallet/ENS search
  - [ ] animation play
  - [ ] `.glb` export
- [ ] Mobile sanity check (reachability + layout)
- [ ] No duplicate logic introduced for presets/search handlers
- [ ] No new global mutable state unless documented
- [ ] Docs updated (`Decisions.md` + `TODO.md`)

---

## 5) Prompt Templates

## Template A — Planner Agent

```txt
You are the Planner Agent for fRiENEMiES Studio.

Context:
- Primary strategy: context/Frienemies-UI-Upgrade-Prep.md
- This slice request: {{slice_request}}

Task:
1) Produce a mini-spec with:
   - Scope
   - Non-goals
   - UI behavior contract
   - Design token contract (type/spacing/glass tier if touched)
   - Acceptance checks (objective)
   - Risk + rollback plan
2) Keep slice small enough to implement in one focused PR.
3) Output markdown only.

Constraints:
- No code edits.
- No architecture refactor unless explicitly requested.
- Prefer changes that preserve current core flows.
```

## Template B — Implementer Agent

```txt
You are the Implementer Agent for fRiENEMiES Studio.

Inputs:
- Mini-spec: {{spec_markdown}}
- Files likely in scope: index.html, style.css, main.js

Task:
1) Implement ONLY what the spec requires.
2) Keep diffs minimal and local.
3) Reuse existing utilities/patterns where possible.
4) Add or adjust comments only where clarity is needed.
5) Update docs:
   - Decisions.md (what + why)
   - TODO.md (mark completed / next)

Output:
- Changed file list
- Acceptance checks mapping (check -> proof)
- Any known limitations

Constraints:
- No opportunistic refactors.
- No behavior changes outside scope.
- Do not break token load/search/animation/export flows.
```

## Template C — Reviewer Agent

```txt
You are the Reviewer Agent for fRiENEMiES Studio.

Inputs:
- Mini-spec: {{spec_markdown}}
- Diff summary: {{diff_or_commit}}

Task:
Audit implementation for:
1) Spec fidelity
2) Regression risk in core flows
3) Code quality and duplication
4) UI consistency (token usage, hierarchy, spacing)
5) Mobile/desktop interaction sanity

Return:
- Verdict: PASS | PASS_WITH_NOTES | FAIL
- Findings (severity-tagged: blocker/major/minor)
- Exact required fixes if not PASS
- Confidence score (0-100)

Constraint:
- Be strict. Do not pass partial mismatches.
```

## Template D — Final Merge Report

```md
# Slice {{slice-id}} — Merge Report

## Verdict
PASS | PASS_WITH_NOTES | FAIL

## What changed
- 

## Acceptance checks
- [ ] Check 1 — evidence
- [ ] Check 2 — evidence

## Regression check
- Token load:
- Wallet/ENS search:
- Animation play:
- GLB export:

## Follow-ups
- 

## Commit(s)
- 
```

---

## 6) Suggested Slice Queue (Use Next)

1. `slice-001-copy-unification` (onboarding + find copy consistency)
2. `slice-002-empty-loading-states` (empty state UX + shimmer)
3. `slice-003-typography-tokens` (type scale normalization)
4. `slice-004-search-entry-unification` (single primary command bar)
5. `slice-005-onboarding-nonblocking` (modal -> guided non-blocking)

Only after these: begin architecture split of `main.js`.

---

## 7) Definition of Done (Program-Level)

Program is successful when:
- User can load target token in <10s from entry
- Returning users are never blocked by onboarding
- UI control surfaces feel consistent and predictable
- No increase in bug reports on core load/preview/export path
- Codebase drift reduced (fewer duplicate handlers + clearer module boundaries)
