# Discord Trigger + Routing Rules (Current Channels)

## Routing policy
- Prefer deterministic routing for production channels.
- If channel has a hard workflow, force the matching skill first.
- If no skill clearly applies, answer normally in-channel.

## Channel rules

### `#bug-reports` (`1470979174112956497`)
Primary skill: `discord-bug-triage`

Trigger when message contains any of:
- bug, broken, error, crash, fail, not loading, can’t export, animation broken
- screenshot/video + repro steps

Required output shape:
- Severity
- Area
- Repro confidence
- Hypothesis
- Next action

Escalation:
- S1 -> immediate `#dev-log` ping/update
- S2/S3 -> normal queue

---

### `#feature-requests` (`1470979175241220238`)
Primary behavior: collect + normalize request (no bug triage)

Trigger when message contains:
- feature, request, add, improve, should have

Output shape:
- Problem
- Proposed solution
- Impact
- Tradeoff

---

### `#studio-updates` (`1470979138792853534`)
Primary skill: `discord-launch-ops`

Trigger when posting release/update/incident status.

Output shape:
- Shipped
- Known issue
- Next
- CTA

---

### `#start-here` (`1470979096866590801`)
Primary skill: `frenemies-copy-canon-guard`

Trigger for pinned onboarding/about copy refresh.

Output shape:
- Canon-aligned short intro
- Disclaimer
- Link list

---

### `#proposals` (`1470979209039057027`)
Primary behavior: structure proposal (not bug triage)

Output shape:
- Objective
- Plan
- Cost/effort
- Success metric
- Vote window

## Fallback rules
- If user asks operational/infra question in any channel, answer directly first, then route follow-up artifact through the matching skill.
- Keep replies in-channel (no auto-thread) unless explicitly requested.
- Keep mention requirement off in active work channels where fast iteration is needed.
