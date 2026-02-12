# fRiENEMiES Skill Specs (v1)

## 1) `discord-bug-triage`

Frontmatter target:
- `name`: `discord-bug-triage`
- `description`: Triage bug reports from Discord into a consistent engineering format. Use for new reports in #bug-reports and bug follow-up threads. Classify severity (S1/S2/S3), area (loader/animation/export/wallet/UI), repro confidence, hypothesis, and next action. Produce GitHub-ready issue text when report quality is sufficient.

Inputs:
- Raw Discord message text
- Attachments/screenshots/videos
- Channel/thread link

Outputs:
- Triage block:
  - Severity
  - Area
  - Repro confidence
  - Hypothesis
  - Next action
- Optional issue draft

Do not trigger when:
- Message is a feature request (route to feature workflow)
- Message is social/chat-only with no defect claim

---

## 2) `discord-launch-ops`

Frontmatter target:
- `name`: `discord-launch-ops`
- `description`: Write concise launch/status announcements and operational updates for Discord channels. Use for #studio-updates, release notes, incident updates, and weekly summaries. Output should be short, concrete, and action-oriented.

Inputs:
- What shipped
- What broke / known issues
- What is next

Outputs:
- Announcement message with clear CTA
- Optional short changelog bullets

Do not trigger when:
- Request is a bug triage request
- Request is long-form strategy discussion

---

## 3) `frenemies-copy-canon-guard`

Frontmatter target:
- `name`: `frenemies-copy-canon-guard`
- `description`: Apply fRiENEMiES brand voice/canon to user-facing copy. Use for website, onboarding, announcements, and pinned Discord copy. Keep tone sharp, concise, community-led, and consistent with canonical lines and disclaimer.

Inputs:
- Draft copy text
- Surface (site, Discord, X, docs)

Outputs:
- Rewritten on-brand copy
- Optional alt variants (max 3)

Do not trigger when:
- Task is purely technical debugging/code fix with no user-facing text

---

## Shared success criteria
- Short, legible outputs (no bloat)
- Deterministic structure for repetitive workflows
- Easy handoff to GitHub and Discord mods
